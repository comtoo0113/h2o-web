"use strict";

(function(SX) {
  const S = SX.homeSurf = {};
  S.LIST = [ [ "linoY", "f", "노란 장판", 3e4, "lino", "rollV", "#a8853f", "옛날 집 누런 모노륨 — 잔 점 무늬가 번들거립니다" ], [ "linoP", "f", "꽃무늬 장판", 45e3, "lino", "rollV", "#a89272", "할머니 댁 꽃무늬 장판" ], [ "woodL", "f", "밝은 원목 마루", 12e4, "wood", "plank", "#a07a48", "꿀빛 참나무 널 — 못 자국 · 옹이" ], [ "woodD", "f", "어두운 원목 마루", 14e4, "wood", "plank", "#5a3a26", "짙은 호두나무 널" ], [ "herring", "f", "헤링본 마루", 26e4, "herring", "plank", "#8a6640", "널을 비스듬히 맞물려 깐 마루" ], [ "lam", "f", "강화마루", 9e4, "lam", "plank", "#8a8274", "회색 참나무 무늬 강화마루 — 디디면 속이 울립니다" ], [ "tileW", "f", "흰 타일", 8e4, "tile", "tile", "#cfcdc4", "흰 사기 타일 · 회색 줄눈" ], [ "tileC", "f", "체크 타일", 95e3, "tile", "tile", "#2e2e33", "검정 · 흰 바둑판 타일" ], [ "terra", "f", "테라조", 22e4, "tile", "tile", "#b4ab9a", "돌 조각을 박아 간 바닥 · 놋쇠 줄눈" ], [ "carpG", "f", "회색 카펫", 7e4, "carpet", "rollC", "#5a5c60", "사무실 같은 회색 카펫" ], [ "carpR", "f", "빨간 카펫", 85e3, "carpet", "rollC", "#7a2c2a", "짙은 빨강 카펫" ], [ "carpP", "f", "무늬 카펫", 15e4, "carpet", "rollC", "#2e3852", "호텔 복도 같은 마름모 무늬" ], [ "concB", "f", "맨 콘크리트", 15e3, "conc", "trowel", "#76736e", "바닥재를 걷어 낸 맨바닥 — 흙손 자국 · 본드 자국" ], [ "concP", "f", "페인트 콘크리트", 4e4, "conc", "rollF", "#56685e", "공장 바닥처럼 칠한 회녹색 · 노란 안전선 조각" ], [ "rubber", "f", "고무 매트", 55e3, "rubber", "mat", "#2e3034", "맞물리는 검정 퍼즐 매트 — 발소리가 줄어듭니다" ], [ "straw", "f", "돗자리", 25e3, "straw", "rollS", "#b09a68", "짚으로 짠 돗자리 · 빨강 · 초록 띠" ], [ "steel", "f", "철판", 11e4, "metal", "metal", "#6e747a", "줄무늬 강판 — 쿵쿵 울립니다" ], [ "turf", "f", "인조 잔디", 6e4, "turf", "rollC", "#3e6430", "옥상 같은 인조 잔디" ], [ "wpFlower", "w", "꽃무늬 벽지", 6e4, "", "paper", "#ac9c78", "누런 크림 바탕 장미 무늬" ], [ "wpStripe", "w", "줄무늬 벽지", 6e4, "", "paper", "#7e8e7e", "두 빛깔 세로 줄 · 금빛 가는 줄" ], [ "wpDamask", "w", "다마스크 벽지", 18e4, "", "paper", "#552a2e", "짙은 자주 바탕 꽃병 무늬" ], [ "pWhite", "w", "흰 페인트", 3e4, "", "paint", "#c6c2b6", "롤러 결이 남은 흰 벽" ], [ "pMint", "w", "민트 페인트", 35e3, "", "paint", "#86ae9e", "옅은 민트색 벽" ], [ "pNavy", "w", "남색 페인트", 35e3, "", "paint", "#384860", "짙은 남색 벽" ], [ "concX", "w", "노출 콘크리트", 5e4, "", "chisel", "#86857f", "거푸집 자국 · 폼타이 구멍" ], [ "brick", "w", "붉은 벽돌", 12e4, "", "brick", "#8a4636", "엇갈려 쌓은 붉은 벽돌" ], [ "panel", "w", "나무 패널", 14e4, "", "board", "#6a4e34", "세로 널 · 허리 몰딩" ], [ "tileWall", "w", "타일 벽", 9e4, "", "tileW", "#ccccc4", "흰 지하철 타일" ], [ "foam", "w", "방음재", 75e3, "", "foam", "#3c3e44", "피라미드 방음 스펀지" ], [ "news", "w", "신문지 벽", 8e3, "", "news", "#b8b29e", "겹쳐 붙인 옛 신문" ], [ "foil", "w", "은박 단열재", 2e4, "", "foil", "#a2a6aa", "은빛 뽁뽁이 단열재 · 테이프 이음" ], [ "graffiti", "w", "낙서 벽", 25e3, "", "spray", "#66665f", "스프레이 낙서 가득한 시멘트 벽" ], [ "plywood", "w", "합판 덧댄 벽", 18e3, "", "board", "#a48a5e", "급하게 덧댄 합판 · 피스 자국" ], [ "tin", "w", "함석 벽", 4e4, "", "tin", "#848a90", "녹물 흐르는 골함석" ], [ "bWood", "b", "원목 걸레받이", 25e3, "", "nail", "#7a5634", "나무 걸레받이" ], [ "bWhite", "b", "흰 몰딩", 2e4, "", "nail", "#d0ccc0", "홈 하나 판 흰 몰딩" ], [ "bSteel", "b", "스테인리스 걸레받이", 35e3, "", "nail", "#9aa0a8", "결 낸 스테인리스 · 나사" ], [ "bBlack", "b", "검은 고무 걸레받이", 12e3, "", "tape", "#2c2c2e", "말랑한 고무 띠" ], [ "bTile", "b", "타일 띠", 3e4, "", "tileW", "#b4ae9e", "작은 타일 한 줄" ] ].map(([id, k, name, price, step, put, col, desc]) => ({
    id,
    k,
    name,
    price,
    step,
    put,
    col,
    desc
  }));
  const PLAIN = [ [ "wcMold", "w", "곰팡이 회벽", 3e4, "paint", "#77725f", "곰팡이가 번진 회색 칠" ], [ "wcBeige", "w", "베이지 칠", 3e4, "paint", "#a09a88", "누런 베이지 칠" ], [ "wcGray", "w", "밝은 회색 칠", 3e4, "paint", "#b8b2a4", "밝은 회색 칠" ], [ "wcBrickL", "w", "벽돌빛 칠", 3e4, "paint", "#8a6a5a", "붉은 기가 도는 칠" ], [ "wcGreen", "w", "짙은 녹색 칠", 3e4, "paint", "#5a6a5a", "짙은 녹색 칠" ], [ "wcBlue", "w", "푸른 회색 칠", 3e4, "paint", "#5a647a", "푸른빛이 도는 회색 칠" ], [ "wcLilac", "w", "연보라 칠", 3e4, "paint", "#8a7a9a", "옅은 보라 칠" ], [ "wcCream", "w", "크림 칠", 3e4, "paint", "#c8b890", "크림색 칠" ], [ "wcChar", "w", "숯색 칠", 3e4, "paint", "#4a4642", "숯처럼 어두운 칠" ], [ "wcBrick", "w", "벽돌색 칠", 3e4, "paint", "#9a5a4a", "벽돌처럼 붉은 칠" ], [ "fsLino", "f", "장판", 3e4, "rollV", "#7c8c57", "흔한 초록빛 비닐 장판", "LINO", 7 ], [ "fsWood", "f", "나무 마루", 6e4, "plank", "#675037", "결이 보이는 나무 마루", "WOOD", 5 ], [ "fsParq", "f", "쪽마루", 7e4, "plank", "#6b5237", "작은 나뭇조각을 맞춰 깐 마루", "PARQ", 17 ], [ "fsTile", "f", "타일", 5e4, "tile", "#aaa9a0", "네모난 바닥 타일", "TILE", 3 ], [ "fsCheck", "f", "바둑판 타일", 6e4, "tile", "#78746a", "두 빛깔이 엇갈리는 바닥 타일", "CHECK", 6 ], [ "fsCarpet", "f", "카펫", 5e4, "rollC", "#485261", "발소리가 줄어드는 카펫", "CARPET", 2 ], [ "fsConc", "f", "콘크리트", 15e3, "trowel", "#56585b", "칠하지 않은 콘크리트", "CONC", 1 ], [ "fsLobby", "f", "석재", 8e4, "tile", "#64635e", "건물 로비 같은 돌바닥", "LOBBY", 14 ], [ "fsMarble", "f", "대리석", 12e4, "tile", "#8b8985", "결이 흐르는 대리석", "MARBLE", 18 ] ].map(([id, k, name, price, put, col, desc, fsName, fsv]) => ({
    id,
    k,
    name,
    price,
    step: "",
    put,
    col,
    desc,
    plain: true,
    hex: k === "w" ? col : null,
    fsName: fsName || null,
    fsv: fsv == null ? null : fsv
  }));
  for (const e of PLAIN) S.LIST.push(e);
  const DOORS = [ [ "drOld", "셸터 나무 문", 1e4, "", "#6b4a2d", "널 두 장 · 놋쇠 손잡이 — 처음 셸터 문" ], [ "drWood", "연립 방문(무늬목)", 4e4, "wood", "#7a4a2c", "체리색 무늬목 방문 — 붙은 쪽지 · 아이 스티커" ], [ "drPly", "합판 문", 15e3, "ply", "#b08a58", "나사로 박은 합판 · 스프레이 번호" ], [ "drSteel", "철제 방화문", 6e4, "steel", "#8d9296", "회색 철문 — 닫히는 소리가 묵직합니다" ], [ "drStain", "스테인리스 관계자 문", 8e4, "stain", "#a4abb0", "결 낸 스테인리스 · 발판" ], [ "drGlass", "알루미늄 틀 유리문", 9e4, "glass", "#9ea4aa", "알루미늄 틀에 유리를 낀 가게 문" ], [ "drSlide", "교실 미닫이", 5e4, "slide", "#a07a48", "옆으로 미는 나무 미닫이 · 유리 창" ], [ "drHosp", "병실 문", 7e4, "hosp", "#c8d2ca", "철망 유리 · 발판 — 가벼운 판 소리" ], [ "drOlive", "군부대 철문", 12e4, "olive", "#5c6440", "국방색 철문 · 리벳 · 빗장" ], [ "drRust", "녹슨 설비 철문", 2e4, "rust", "#4e5652", "녹슨 철문 · 환기 살 — 긁히는 소리" ], [ "drSite", "현장 사무실 문", 3e4, "site", "#c6cac2", "공사장 가설 사무실 철문" ], [ "drStudio", "방송국 방음문", 15e4, "studio", "#3c3e46", "누빈 방음문 — 두껍고 무겁습니다" ], [ "drWoodC", "깔끔한 무늬목 방문", 5e4, "woodC", "#7a4a2c", "쪽지 · 스티커 · 흠집 없는 새 무늬목 방문" ], [ "drPlyC", "깔끔한 합판 문", 25e3, "plyC", "#b08a58", "낙서 · 테이프 없는 새 합판 문" ], [ "drSteelC", "깔끔한 철제 방화문", 7e4, "steelC", "#8d9296", "딱지 · 녹 점 · 신발 자국 없는 새 철문" ], [ "drStainC", "깔끔한 스테인리스 문", 9e4, "stainC", "#a4abb0", "경고판 · 손때 없는 새 스테인리스 문" ], [ "drGlassC", "깔끔한 유리문", 1e5, "glassC", "#9ea4aa", "붙은 종이 · 금 · 먼지 없는 맑은 유리문" ], [ "drSlideC", "깔끔한 교실 미닫이", 6e4, "slideC", "#a07a48", "이름표 · 낙서 없는 새 미닫이" ], [ "drHospC", "깔끔한 병실 문", 8e4, "hospC", "#c8d2ca", "핏자국 · 딱지 없는 새 병실 문" ], [ "drOliveC", "깔끔한 국방색 철문", 13e4, "oliveC", "#5c6440", "벗겨짐 · 녹물 · 흙 없는 새 철문" ], [ "drRustC", "깔끔한 설비 철문", 3e4, "rustC", "#4e5652", "녹 없이 새로 칠한 설비 철문 · 환기 살" ], [ "drSiteC", "깔끔한 현장 사무실 문", 4e4, "siteC", "#c6cac2", "딱지 · 흙 · 찌그러짐 없는 새 철문" ], [ "drStudioC", "깔끔한 방음문", 16e4, "studioC", "#3c3e46", "쪽지 · 찢어짐 없는 새 방음문" ] ].map(([id, name, price, sty, col, desc]) => ({
    id,
    k: "d",
    name,
    price,
    step: "",
    put: "",
    col,
    desc,
    sty
  }));
  for (const e of DOORS) S.LIST.push(e);
  S.BY = {};
  S.PRICES = {};
  S.IDS = {
    f: [],
    w: [],
    b: [],
    d: []
  };
  for (const e of S.LIST) {
    S.BY[e.id] = e;
    S.PRICES[e.id] = e.price;
    S.IDS[e.k].push(e.id);
  }
  S.KIND = {
    f: "바닥재",
    w: "벽지",
    b: "걸레받이",
    d: "문"
  };
  S.CELL_IDS = [ "linoY", "linoP", "woodL", "woodD", "herring", "lam", "tileW", "tileC", "terra", "carpG", "carpR", "carpP", "concB", "concP", "rubber", "straw", "steel", "turf", "wpFlower", "wpStripe", "wpDamask", "pWhite", "pMint", "pNavy", "concX", "brick", "panel", "tileWall", "foam", "news", "foil", "graffiti", "plywood", "tin", "bWood", "bWhite", "bSteel", "bBlack", "bTile", "wcMold", "wcBeige", "wcGray", "wcBrickL", "wcGreen", "wcBlue", "wcLilac", "wcCream", "wcChar", "wcBrick", "fsLino", "fsWood", "fsParq", "fsTile", "fsCheck", "fsCarpet", "fsConc", "fsLobby", "fsMarble" ];
  const ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#$%&()*+-/:;<=>?@[]^_{|}~";
  S.CH = {};
  S.UNCH = {};
  S.CELL_IDS.forEach((id, n) => {
    if (S.BY[id] && ALPHA[n]) {
      S.CH[id] = ALPHA[n];
      S.UNCH[ALPHA[n]] = id;
    }
  });
  const rgbOf = hx => {
    const m = /^#?([0-9a-f]{6})$/i.exec(String(hx || "").trim());
    if (!m) return null;
    const n = parseInt(m[1], 16);
    return [ n >> 16, n >> 8 & 255, n & 255 ];
  };
  S.wallId = function(hx) {
    const c = rgbOf(hx);
    if (!c) return "";
    let best = "", bd = Infinity;
    for (const e of S.LIST) {
      if (!e.plain || e.k !== "w") continue;
      const q = rgbOf(e.hex), dd = (q[0] - c[0]) ** 2 + (q[1] - c[1]) ** 2 + (q[2] - c[2]) ** 2;
      if (dd < bd) {
        bd = dd;
        best = e.id;
      }
    }
    return best;
  };
  S.fsId = fs => {
    if (typeof fs !== "number") return "";
    for (const e of S.LIST) if (e.plain && e.k === "f" && e.fsv === (fs | 0)) return e.id;
    return "";
  };
  S.legacyIds = function(h) {
    const out = [];
    if (!h || typeof h !== "object") return out;
    const add = id => {
      if (id && out.indexOf(id) < 0) out.push(id);
    };
    const one = o => {
      if (!o || typeof o !== "object") return;
      if (typeof o.wall === "string" && o.wall) add(S.wallId(o.wall));
      if (typeof o.floor === "number") add(S.fsId(o.floor));
    };
    const rooms = rm => {
      if (rm && typeof rm === "object") for (const k of Object.keys(rm).slice(0, 64)) one(rm[k]);
    };
    one(h);
    rooms(h.rooms);
    const Ls = h.layouts;
    if (Ls && typeof Ls === "object") for (const t of Object.keys(Ls).slice(0, 32)) {
      one(Ls[t]);
      rooms(Ls[t] && Ls[t].rooms);
    }
    return out;
  };
  const V = (base, n, r, v) => {
    const a = [];
    for (let k = 1; k <= n; k++) a.push([ base + "_" + k, r || 1, v == null ? 1 : v ]);
    return a;
  };
  if (SX.audio && SX.audio.addSounds) SX.audio.addSounds({
    bank: {
      step_lino: V("step_lino", 6),
      step_rubber: V("step_rubber", 6),
      step_tilef: V("step_tilef", 8),
      step_herring: V("step_herring", 6),
      step_lam: V("step_lam", 6),
      step_metal: V("step_metal", 8),
      step_turf: V("step_turf", 6),
      step_straw: V("step_straw", 4),
      spCloth: V("sp_cloth", 3),
      spThump: [ [ "sp_thump", 1, 1 ], [ "sp_thump", .9, 1 ] ],
      spTarp: V("sp_tarp", 3),
      spTile: V("sp_tile", 5),
      spGrit: V("sp_grit", 2),
      spBrush: V("sp_brush", 3),
      spRoll: V("sp_roll", 4),
      spPaste: V("sp_paste", 2),
      spSpray: [ [ "sp_spray", 1, 1 ], [ "sp_spray", 1.08, 1 ] ],
      spBubble: V("sp_bubble", 2),
      spTape: V("sp_tape", 3),
      spNail: V("sp_nail", 2),
      spBoard: V("sp_board", 3),
      spBrick: [ [ "sp_brick", 1, 1 ], [ "sp_brick", .92, 1 ] ],
      spSheet: V("sp_sheet", 2),
      spChisel: V("sp_chisel", 2),
      spPaper: [ [ "sp_paper", 1, 1 ], [ "sp_paper", .9, 1 ] ]
    },
    gain: {
      step_lino: .36,
      step_rubber: .34,
      step_tilef: .42,
      step_herring: .38,
      step_lam: .4,
      step_metal: .42,
      step_turf: .36,
      step_straw: .32,
      spCloth: .5,
      spThump: .55,
      spTarp: .5,
      spTile: .5,
      spGrit: .4,
      spBrush: .45,
      spRoll: .45,
      spPaste: .4,
      spSpray: .45,
      spBubble: .45,
      spTape: .5,
      spNail: .55,
      spBoard: .55,
      spBrick: .6,
      spSheet: .5,
      spChisel: .5,
      spPaper: .45
    },
    steps: {
      lino: "step_lino",
      rubber: "step_rubber",
      tilef: "step_tilef",
      herring: "step_herring",
      lam: "step_lam",
      metal: "step_metal",
      turf: "step_turf",
      straw: "step_carpet"
    },
    mix: {
      straw: "step_straw"
    },
    fx: {
      surfPut(d, t, o, smp, pick) {
        const q = PUT[o.put] || PUT[""];
        if (!pick(q[0][1])) return false;
        for (const [dt, n, v, r] of q) smp(d, t + dt, n, {
          v: v == null ? 1 : v,
          r: r || 1
        });
        return true;
      },
      surfBuy(d, t, o, smp, pick) {
        if (!pick("buy")) return false;
        smp(d, t, "buy");
        if (pick("spThump")) smp(d, t + .25, "spThump", {
          v: .6
        });
        return true;
      }
    }
  });
  const PUT = {
    rollV: [ [ 0, "spTarp" ], [ .55, "spThump", .8 ], [ .9, "spBrush", .6 ] ],
    rollC: [ [ 0, "spCloth" ], [ .5, "spThump" ], [ .85, "spBrush", .5 ] ],
    rollS: [ [ 0, "spPaper", .7 ], [ .15, "spCloth", .8 ], [ .6, "spThump", .6 ] ],
    tile: [ [ 0, "spTile" ], [ .45, "spTile", .8 ], [ .9, "spTile", .9 ], [ 1.2, "spGrit", .6 ] ],
    plank: [ [ 0, "spBoard" ], [ .5, "spBoard", .8 ], [ .95, "spNail", .7 ] ],
    trowel: [ [ 0, "spGrit" ], [ .7, "spGrit", .8 ] ],
    rollF: [ [ 0, "spRoll" ], [ .6, "spRoll", .9 ] ],
    mat: [ [ 0, "spThump" ], [ .35, "spThump", .85, .9 ], [ .7, "spTarp", .5 ] ],
    metal: [ [ 0, "spSheet" ], [ .55, "spBoard", .5, .8 ], [ .9, "spNail", .6, .85 ] ],
    paper: [ [ 0, "spPaper" ], [ .25, "spPaste", .7 ], [ .75, "spBrush" ], [ 1.1, "spBrush", .8 ] ],
    paint: [ [ 0, "spRoll" ], [ .5, "spRoll", .95 ], [ 1, "spRoll", .85 ] ],
    spray: [ [ 0, "spSpray" ], [ .7, "spSpray", .8 ] ],
    brick: [ [ 0, "spBrick" ], [ .4, "spBrick", .85 ], [ .8, "spBrick", .9 ], [ 1.1, "spGrit", .5 ] ],
    board: [ [ 0, "spBoard" ], [ .5, "spNail" ], [ .95, "spNail", .8 ] ],
    tileW: [ [ 0, "spTile", .7, 1.1 ], [ .4, "spTile", .7, 1.15 ], [ .8, "spGrit", .5 ] ],
    foam: [ [ 0, "spTape" ], [ .35, "spPaste", .6 ], [ .7, "spTape", .8 ] ],
    foil: [ [ 0, "spBubble" ], [ .6, "spTape" ] ],
    news: [ [ 0, "spPaper" ], [ .35, "spTape", .8 ], [ .7, "spPaper", .8 ], [ .95, "spTape", .7 ] ],
    chisel: [ [ 0, "spChisel" ], [ .6, "spGrit", .6 ] ],
    tin: [ [ 0, "spSheet" ], [ .55, "spNail", .8 ] ],
    nail: [ [ 0, "spNail" ], [ .5, "spNail", .8 ] ],
    tape: [ [ 0, "spTape" ], [ .4, "spThump", .4 ] ],
    "": [ [ 0, "spBrush", .6 ], [ .35, "spThump", .5 ] ]
  };
  S.PUT = PUT;
  const H = SX.home;
  if (!H) return;
  const TK = t => String(t | 0), DOT = ".";
  const okTier = t => /^\d{1,2}$/.test(String(t)) && !!H.TIERS[t | 0];
  S.fix = function(h) {
    if (!h || typeof h !== "object") return h;
    const ids = L => {
      const out = [];
      for (const id of Array.isArray(L) ? L : []) if (typeof id === "string" && S.BY[id] && !out.includes(id)) out.push(id);
      return out;
    };
    h.surfOwn = ids(h.surfOwn);
    h.surfGift = ids(h.surfGift).filter(id => !h.surfOwn.includes(id));
    const src = h.surf && typeof h.surf === "object" ? h.surf : {}, out = {};
    for (const t in src) {
      if (!okTier(t) || !src[t] || typeof src[t] !== "object") continue;
      const m = {};
      for (const key in src[t]) {
        const o = src[t][key];
        if (!/^[rd]\d+$/.test(key) || !o || typeof o !== "object") continue;
        const q = {};
        for (const k of [ "f", "w", "b" ]) if (typeof o[k] === "string" && S.BY[o[k]] && S.BY[o[k]].k === k) q[k] = o[k];
        if (Object.keys(q).length) m[key] = q;
      }
      if (Object.keys(m).length) out[TK(t)] = m;
    }
    h.surf = out;
    const cs = h.cells && typeof h.cells === "object" ? h.cells : {}, co = {};
    for (const t in cs) {
      const Y = okTier(t) ? S.layout(t | 0) : null, c = cs[t];
      if (!Y || !c || typeof c !== "object") continue;
      const m = {};
      for (const k of [ "f", "w", "b" ]) {
        const s = c[k];
        if (typeof s !== "string" || s.length !== Y.N) continue;
        let q = "";
        for (let g = 0; g < s.length; g++) {
          const ch = s[g], id = ch === DOT ? null : S.UNCH[ch];
          q += id && S.BY[id].k === k ? ch : DOT;
        }
        if (/[^.]/.test(q)) m[k] = q;
      }
      if (Object.keys(m).length) co[TK(t)] = m;
    }
    h.cells = co;
    const ds = h.door && typeof h.door === "object" ? h.door : {}, dq = {};
    for (const t in ds) {
      const id = ds[t];
      if (okTier(t) && typeof id === "string" && S.BY[id] && S.BY[id].k === "d") dq[TK(t)] = id;
    }
    h.door = dq;
    const os = h.doors && typeof h.doors === "object" ? h.doors : {}, oq = {};
    for (const t in os) {
      const o = os[t];
      if (!okTier(t) || !o || typeof o !== "object") continue;
      const m = {};
      for (const key in o) {
        const id = o[key];
        if (/^(e|d\d{1,2})$/.test(key) && (id === "" || typeof id === "string" && S.BY[id] && S.BY[id].k === "d")) m[key] = id;
      }
      if (Object.keys(m).length) oq[TK(t)] = m;
    }
    h.doors = oq;
    return h;
  };
  S.doorId = (h, tier) => {
    const id = h && h.door && typeof h.door === "object" ? h.door[TK(tier)] : "";
    return typeof id === "string" && S.BY[id] && S.BY[id].k === "d" && S.owns(id, h) ? id : "";
  };
  S.doorSty = (h, tier) => {
    const id = S.doorId(h, tier);
    return id ? S.BY[id].sty || null : undefined;
  };
  S.doorsOf = (h, tier) => {
    const o = h && h.doors && typeof h.doors === "object" ? h.doors[TK(tier)] : null;
    return o && typeof o === "object" && Object.keys(o).length ? o : null;
  };
  S.doorKeyId = (h, tier, key) => {
    const o = S.doorsOf(h, tier), id = o ? o[key] : undefined;
    return id === "" ? "" : typeof id === "string" && S.BY[id] && S.BY[id].k === "d" && S.owns(id, h) ? id : undefined;
  };
  S.own = h => {
    h = h || H.save();
    if (!Array.isArray(h.surfOwn)) S.fix(h);
    return h.surfOwn;
  };
  S.gift = h => {
    h = h || H.save();
    if (!Array.isArray(h.surfGift)) h.surfGift = [];
    return h.surfGift;
  };
  S.owns = (id, h) => {
    h = h || H.save();
    return S.own(h).includes(id) || S.gift(h).includes(id);
  };
  S.ownN = (h, k) => S.LIST.filter(e => (!k || e.k === k) && S.owns(e.id, h)).length;
  const layCache = {};
  S.layout = function(tier) {
    tier = tier | 0;
    if (layCache[tier]) return layCache[tier];
    const t = H.TIERS[tier];
    if (!t || !SX.map || !SX.map.homePlan) return null;
    const P = SX.map.homePlan(t), W = P.w + 2, HH = P.h + 2, N = W * HH, o = (SX.map.HOME_MG | 0) + 1;
    const gi = (x, y) => x < -1 || y < -1 || x > P.w || y > P.h ? -1 : (y + 1) * W + (x + 1);
    const kind = new Uint8Array(N), room = new Int16Array(N).fill(-1), hz = new Uint8Array(N);
    const set = (x, y, v) => {
      const g = gi(x, y);
      if (g >= 0) kind[g] = v;
      return g;
    };
    const wallAt = (x, y) => {
      const g = gi(x, y);
      if (g >= 0 && !kind[g]) kind[g] = 2;
    };
    const zr = P.rects.map((r, k) => r.zone != null && P.rects[r.zone] ? r.zone : k);
    P.rects.forEach((r, k) => {
      for (let y = r.y0; y <= r.y1; y++) for (let x = r.x0; x <= r.x1; x++) {
        const g = set(x, y, 1);
        if (g >= 0) room[g] = k;
      }
    });
    for (const r of P.rects) {
      for (let x = r.x0 - 1; x <= r.x1 + 1; x++) {
        wallAt(x, r.y0 - 1);
        wallAt(x, r.y1 + 1);
      }
      for (let y = r.y0 - 1; y <= r.y1 + 1; y++) {
        wallAt(r.x0 - 1, y);
        wallAt(r.x1 + 1, y);
      }
    }
    for (const s of P.strips || []) {
      const e = s.ends === false ? 0 : 1;
      for (let y = s.y0; y <= s.y1; y++) for (let x = s.x0; x <= s.x1; x++) set(x, y, 5);
      for (let x = s.x0 - e; x <= s.x1 + e; x++) {
        wallAt(x, s.y0 - 1);
        wallAt(x, s.y1 + 1);
      }
      if (e) for (let y = s.y0 - 1; y <= s.y1 + 1; y++) {
        wallAt(s.x0 - 1, y);
        wallAt(s.x1 + 1, y);
      }
    }
    for (const q of P.parapets || []) for (let y = q.y0; y <= q.y1; y++) for (let x = q.x0; x <= q.x1; x++) {
      const g = gi(x, y);
      if (g >= 0 && kind[g] === 2) kind[g] = 5;
    }
    const doorOf = new Int16Array(N).fill(-1);
    P.doors.forEach((d, k) => {
      const h1 = d.horiz !== false, len = d.len || 2;
      for (let j = 0; j < len; j++) {
        const g = set(d.x + (h1 ? j : 0), d.y + (h1 ? 0 : j), 3);
        if (g >= 0) {
          doorOf[g] = k;
          hz[g] = h1 ? 1 : 0;
        }
      }
    });
    for (const s of P.stairs || []) for (let y = s.y0; y <= s.y1; y++) for (let x = s.x0; x <= s.x1; x++) set(x, y, 5);
    for (let j = 0; j < 2; j++) {
      const vr = P.entry.side === "r", g = set(P.entry.x + (vr ? 0 : j), P.entry.y + (vr ? j : 0), 4);
      if (g >= 0) hz[g] = vr ? 0 : 1;
    }
    const area = P.rects.map(r => (r.x1 - r.x0 + 1) * (r.y1 - r.y0 + 1)), za = area.map(() => 0), out = P.rects.map(r => !!r.out);
    area.forEach((n, k) => {
      za[zr[k]] += n;
    });
    const big = (a, b) => a < 0 ? b : b < 0 ? a : out[a] !== out[b] ? out[a] ? b : a : za[b] > za[a] ? b : a;
    const rm = (x, y) => {
      const g = gi(x, y);
      return g >= 0 && kind[g] === 1 ? zr[room[g]] : -1;
    };
    const wallZone = (x, y) => {
      let z = rm(x, y + 1);
      if (z >= 0) return z;
      z = big(rm(x - 1, y + 1), rm(x + 1, y + 1));
      if (z >= 0) return z;
      z = big(rm(x - 1, y), rm(x + 1, y));
      if (z >= 0) return z;
      z = rm(x, y - 1);
      if (z >= 0) return z;
      return big(rm(x - 1, y - 1), rm(x + 1, y - 1));
    };
    const cellF = new Int16Array(N).fill(-1), cellW = new Int16Array(N).fill(-1), list = [];
    for (let g = 0; g < N; g++) {
      const x = g % W - 1, y = (g / W | 0) - 1, kd = kind[g];
      if (kd === 1) cellF[g] = zr[room[g]]; else if (kd === 3) cellF[g] = hz[g] ? big(rm(x, y - 1), rm(x, y + 1)) : big(rm(x - 1, y), rm(x + 1, y));
      if (kd === 2 || kd === 3 || kd === 4) cellW[g] = wallZone(x, y);
      if (cellF[g] >= 0 || cellW[g] >= 0) list.push(g);
    }
    const dfl = (r, k) => {
      const id = r.surf && r.surf[k];
      return id && S.BY[id] && S.BY[id].k === k ? id : "";
    };
    const zones = P.rects.map((r, k) => ({
      key: "r" + k,
      k,
      name: r.name,
      area: za[k],
      join: zr[k] !== k,
      door: false,
      fl: [],
      wl: [],
      n: 0,
      x0: o + r.x0,
      y0: o + r.y0,
      x1: o + r.x1,
      y1: o + r.y1,
      fs: r.fs != null ? r.fs : t.floor,
      surf: r.surf || null,
      dF: dfl(r, "f"),
      dW: dfl(r, "w"),
      dB: dfl(r, "b")
    }));
    for (const g of list) {
      if (cellF[g] >= 0) zones[cellF[g]].fl.push(g);
      if (cellW[g] >= 0) zones[cellW[g]].wl.push(g);
    }
    for (const z of zones) z.n = z.fl.length;
    return layCache[tier] = {
      tier,
      t,
      P,
      W,
      HH,
      N,
      o,
      gi,
      kind,
      room,
      hz,
      doorOf,
      cellF,
      cellW,
      zones,
      list,
      gx: g => g % W - 1,
      gy: g => (g / W | 0) - 1
    };
  };
  S.zonesOf = tier => {
    const Y = S.layout(tier);
    return Y ? Y.zones.filter(z => !z.join) : [];
  };
  S.zoneGs = function(keys, k, tier) {
    const Y = S.layout(tier == null ? H.save().tier : tier);
    if (!Y) return [];
    const out = [];
    for (const z of Y.zones) if (keys.indexOf(z.key) >= 0) for (const g of k === "f" ? z.fl : z.wl) out.push(g);
    return out;
  };
  S.cellsOf = (h, tier) => {
    const c = h && h.cells && h.cells[TK(tier)];
    return c && typeof c === "object" ? c : null;
  };
  S.cellId = function(h, tier, k, g) {
    const c = S.cellsOf(h, tier), s = c && c[k];
    if (typeof s !== "string") return "";
    const ch = s[g];
    if (!ch || ch === DOT) return "";
    const id = S.UNCH[ch];
    return id && S.BY[id] && S.BY[id].k === k ? id : "";
  };
  S.cellPut = function(h, tier, k, gs, id) {
    const Y = S.layout(tier), ch = id ? S.CH[id] : DOT;
    if (!Y || !ch || !gs.length) return 0;
    if (!h.cells || typeof h.cells !== "object") h.cells = {};
    const T = TK(tier), c = h.cells[T] && typeof h.cells[T] === "object" ? h.cells[T] : {}, a = (typeof c[k] === "string" && c[k].length === Y.N ? c[k] : DOT.repeat(Y.N)).split("");
    let n = 0;
    for (const g of gs) if (g >= 0 && g < Y.N && a[g] !== ch) {
      a[g] = ch;
      n++;
    }
    if (!n) return 0;
    const s = a.join("");
    if (/[^.]/.test(s)) c[k] = s; else delete c[k];
    if (Object.keys(c).length) h.cells[T] = c; else delete h.cells[T];
    return n;
  };
  function migrateTier(h, t, L, M) {
    const Y = S.layout(t);
    if (!Y) return;
    const td = H.TIERS[t], parts = H.partsOf(t), main = parts[0], nR = Y.P.rects.length, rooms = L.rooms && typeof L.rooms === "object" ? L.rooms : {};
    const ro = p => p && rooms[p.key] && typeof rooms[p.key] === "object" ? rooms[p.key] : null;
    const sget = (key, k) => {
      const o = M[key], id = o && o[k];
      return id && S.BY[id] && S.BY[id].k === k && S.owns(id, h) ? id : "";
    };
    const odf = (p, k) => {
      const id = p && p.surf && p.surf[k];
      if (!id || !S.BY[id] || S.BY[id].k !== k) return "";
      const o = ro(p);
      if (k === "w" && (o && o.wall || L.wall)) return "";
      if (k === "f" && (o && o.floor != null || L.floor != null)) return "";
      return id;
    };
    const oldFs = p => {
      const o = ro(p);
      if (o && typeof o.floor === "number") return {
        fs: o.floor,
        user: true
      };
      if (p.door) return main && !main.door ? oldFs(main) : {
        fs: td.floor,
        user: false
      };
      if (typeof L.floor === "number") return {
        fs: L.floor,
        user: true
      };
      return {
        fs: p.fs != null ? p.fs : td.floor,
        user: false
      };
    };
    const oldF = p => {
      let f = sget(p.key, "f"), user = !!f;
      if (!f) f = odf(p, "f");
      if (!f && p.door && main) {
        f = sget(main.key, "f");
        user = !!f;
        if (!f && !(ro(p) && ro(p).floor != null)) f = odf(main, "f");
      }
      return f ? {
        id: f,
        user
      } : oldFs(p);
    };
    const oldW = p => {
      const s = sget(p.key, "w");
      if (s) return {
        id: s,
        user: true
      };
      const d = odf(p, "w");
      if (d) return {
        id: d,
        user: false
      };
      const o = ro(p);
      if (o && o.wall) return {
        hex: o.wall,
        user: true
      };
      if (L.wall) return {
        hex: L.wall,
        user: true
      };
      return {
        hex: td.wall,
        user: false
      };
    };
    const oldB = p => {
      const s = sget(p.key, "b");
      return s ? {
        id: s,
        user: true
      } : {
        id: odf(p, "b"),
        user: false
      };
    };
    const NB = [ [ 0, 1 ], [ 0, -1 ], [ -1, 0 ], [ 1, 0 ], [ -1, 1 ], [ 1, 1 ], [ -1, -1 ], [ 1, -1 ] ];
    const rmAt = (x, y) => {
      const g = Y.gi(x, y);
      return g >= 0 && Y.kind[g] === 1 ? Y.room[g] : -1;
    };
    const wallPart = (x, y) => {
      for (const [dx, dy] of NB) {
        const k = rmAt(x + dx, y + dy);
        if (k >= 0) return parts[k];
      }
      return null;
    };
    const put = {
      f: new Map,
      w: new Map,
      b: new Map
    }, add = (k, id, g) => {
      if (!id) return;
      if (!put[k].has(id)) put[k].set(id, []);
      put[k].get(id).push(g);
    };
    for (const g of Y.list) {
      const kd = Y.kind[g];
      if (Y.cellF[g] >= 0) {
        const p = kd === 1 ? parts[Y.room[g]] : parts[nR + Y.doorOf[g]], lk = p ? oldF(p) : null, z = Y.zones[Y.cellF[g]];
        if (lk && lk.user) {
          const id = lk.id || S.fsId(lk.fs), dflt = z.dF ? z.dF === lk.id : !lk.id && lk.fs === z.fs;
          if (!dflt) add("f", id, g);
        }
      }
      if (Y.cellW[g] >= 0) {
        const p = kd === 2 ? wallPart(Y.gx(g), Y.gy(g)) : parts[Y.cellW[g]], z = Y.zones[Y.cellW[g]];
        if (!p) continue;
        const lw = oldW(p), lb = oldB(p);
        if (lw.user) {
          const id = lw.id || S.wallId(lw.hex), dflt = z.dW ? z.dW === lw.id : !lw.id && String(lw.hex).toLowerCase() === String(td.wall).toLowerCase();
          if (!dflt) add("w", id, g);
        }
        if (lb.user && lb.id !== z.dB) add("b", lb.id, g);
      }
    }
    for (const k of [ "f", "w", "b" ]) for (const [id, gs] of put[k]) S.cellPut(h, t, k, gs, id);
  }
  S.migrate = function(h) {
    if (!h || typeof h !== "object") return h;
    S.own(h);
    S.gift(h);
    const Ls = h.layouts && typeof h.layouts === "object" ? h.layouts : {}, surf = h.surf && typeof h.surf === "object" ? h.surf : {};
    const leg = o => !!o && typeof o === "object" && (!!o.wall || typeof o.floor === "number" || !!o.rooms && typeof o.rooms === "object" && Object.keys(o.rooms).length > 0);
    const tiers = new Set;
    if (leg(h)) tiers.add(h.tier | 0);
    for (const t in surf) tiers.add(t | 0);
    for (const t in Ls) if (leg(Ls[t])) tiers.add(t | 0);
    if (!tiers.size) {
      h.cv = 1;
      return h;
    }
    for (const id of S.legacyIds(h)) if (!h.surfOwn.includes(id) && !h.surfGift.includes(id)) h.surfGift.push(id);
    for (const t of tiers) {
      if (!H.TIERS[t]) continue;
      const L = t === (h.tier | 0) ? {
        wall: h.wall,
        floor: h.floor,
        rooms: h.rooms
      } : Ls[t] && typeof Ls[t] === "object" ? Ls[t] : {};
      try {
        migrateTier(h, t, L, surf[TK(t)] || {});
      } catch (e) {
        if (typeof console !== "undefined") console.warn("surf migrate", t, e);
      }
    }
    h.wall = null;
    h.floor = null;
    h.rooms = {};
    for (const t in Ls) if (Ls[t] && typeof Ls[t] === "object") {
      Ls[t].wall = null;
      Ls[t].floor = null;
      Ls[t].rooms = {};
    }
    h.surf = {};
    h.cv = 1;
    return h;
  };
  S.build = function(F, t, home, parts) {
    const Y = S.layout(t.id), NF = F.W * F.H;
    F.sf = new Uint8Array(NF);
    F.sw = new Uint8Array(NF);
    F.sb = new Uint8Array(NF);
    F.swc = new Uint8Array(NF);
    F.cellG = new Int32Array(NF).fill(-1);
    F.surfTier = t.id | 0;
    F.surfLay = Y;
    F.surfHome = home;
    F.surfCells = {};
    {
      const ds = S.doorSty(home, t.id);
      if (ds !== undefined) F.homeDoor = ds;
    }
    S.doorTag(F, home);
    if (Y) {
      F.gF = new Int32Array(Y.N).fill(-1);
      for (const g of Y.list) {
        const fx = Y.gx(g) + Y.o, fy = Y.gy(g) + Y.o;
        if (!F.in(fx, fy)) continue;
        const i = F.i(fx, fy);
        F.gF[g] = i;
        F.cellG[i] = g;
      }
      for (const z of Y.zones) F.surfCells[z.key] = {
        fl: z.fl.map(g => F.gF[g]).filter(i => i >= 0),
        wl: z.wl.map(g => F.gF[g]).filter(i => i >= 0),
        k: z.k
      };
    }
    F.sfAt = i => F.sf[i] ? S.IDS.f[F.sf[i] - 1] : null;
    F.swAt = (x, y) => {
      if (!F.in(x, y)) return null;
      const i = F.i(x, y), w = F.sw[i], b = F.sb[i];
      return w || b ? {
        w: w ? S.IDS.w[w - 1] : null,
        b: b ? S.IDS.b[b - 1] : null
      } : null;
    };
    const base = F.wallColAt;
    F.wallColAt = (x, y) => {
      if (F.in(x, y)) {
        const i = F.i(x, y), c = F.swc[i];
        if (c) {
          const e = S.BY[S.IDS.w[c - 1]];
          if (e && e.hex) return e.hex;
        }
        const w = F.sw[i];
        if (w && SX.artSurf) return SX.artSurf.wallBase(S.IDS.w[w - 1]);
      }
      return base ? base(x, y) : F.wallCol;
    };
    S.paint(F, home, true);
  };
  S.pv = null;
  S.paint = function(F, h, init) {
    if (!F || !F.surfLay || !F.gF) return;
    const Y = F.surfLay, tier = F.surfTier;
    h = h || (SX.hub && SX.hub.scene === "visit" ? F.surfHome : H.save()) || F.surfHome;
    const c = S.cellsOf(h, tier) || {}, pv = S.pv && S.pv.tier === tier ? S.pv : null, own = new Set(S.own(h).concat(S.gift(h)));
    const idOf = (k, g) => {
      if (pv && pv.k === k && pv.set.has(g)) return pv.id;
      const s = c[k];
      if (typeof s !== "string") return "";
      const ch = s[g];
      if (!ch || ch === DOT) return "";
      const id = S.UNCH[ch];
      return id && S.BY[id] && S.BY[id].k === k && own.has(id) ? id : "";
    };
    let chF = false, chW = false;
    for (const g of Y.list) {
      const i = F.gF[g];
      if (i < 0) continue;
      const zf = Y.cellF[g];
      if (zf >= 0) {
        const z = Y.zones[zf], id = idOf("f", g) || z.dF;
        let sfi = 0, fs = z.fs;
        if (id) {
          const e = S.BY[id];
          if (e.plain) {
            const A = SX.art && SX.art.FS;
            fs = A && e.fsName && A[e.fsName] != null ? A[e.fsName] : e.fsv;
          } else sfi = S.IDS.f.indexOf(id) + 1;
        }
        if (F.sf[i] !== sfi) {
          F.sf[i] = sfi;
          chF = true;
        }
        if (F.fs[i] !== fs) {
          F.fs[i] = fs;
          chF = true;
        }
      }
      const zw = Y.cellW[g];
      if (zw >= 0) {
        const z = Y.zones[zw], id = idOf("w", g) || z.dW, b = idOf("b", g) || z.dB;
        let swi = 0, swc = 0;
        if (id) {
          if (S.BY[id].plain) swc = S.IDS.w.indexOf(id) + 1; else swi = S.IDS.w.indexOf(id) + 1;
        }
        const bi = b ? S.IDS.b.indexOf(b) + 1 : 0;
        if (F.sw[i] !== swi || F.swc[i] !== swc || F.sb[i] !== bi) {
          F.sw[i] = swi;
          F.swc[i] = swc;
          F.sb[i] = bi;
          chW = true;
        }
      }
    }
    if (init) return;
    if (chF && F.chunks) F.chunks.clear();
    if (chW && F.dh) {
      F.dh.strips.clear();
      F.dh.key = null;
    }
  };
  S.stepAt = function(F, x, y) {
    if (!F || !F.sf) return null;
    const tx = Math.floor(x), ty = Math.floor(y);
    if (!F.in(tx, ty)) return null;
    const id = F.sfAt(F.i(tx, ty));
    return id ? S.BY[id].step : null;
  };
  S.cellAt = function(F, wx, wy, k) {
    const Y = F && F.surfLay;
    if (!Y || !F.cellG) return -1;
    const tx = Math.floor(wx), at = ty => F.in(tx, ty) ? F.cellG[F.i(tx, ty)] : -1;
    if (k === "f") {
      const g = at(Math.floor(wy));
      return g >= 0 && Y.cellF[g] >= 0 ? g : -1;
    }
    for (const ty of [ Math.floor(wy + .75), Math.floor(wy) ]) {
      const g = at(ty);
      if (g >= 0 && Y.cellW[g] >= 0 && Y.kind[g] !== 1 && !(Y.kind[g] === 3 && !Y.hz[g])) return g;
    }
    return -1;
  };
  S.zoneAt = function(F, wx, wy) {
    const Y = F && F.surfLay;
    if (!Y || !F.cellG) return null;
    const tx = Math.floor(wx), ty = Math.floor(wy), g0 = F.in(tx, ty) ? F.cellG[F.i(tx, ty)] : -1;
    if (g0 >= 0 && Y.cellF[g0] >= 0) return Y.zones[Y.cellF[g0]].key;
    const g = S.cellAt(F, wx, wy, "w");
    return g >= 0 ? Y.zones[Y.cellW[g]].key : null;
  };
  S.lineCells = function(Y, a, b) {
    const x0 = a % Y.W, y0 = a / Y.W | 0, x1 = b % Y.W, y1 = b / Y.W | 0, n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)), out = [];
    for (let s = 1; s <= n; s++) {
      const g = Math.round(y0 + (y1 - y0) * s / n) * Y.W + Math.round(x0 + (x1 - x0) * s / n);
      if (out[out.length - 1] !== g) out.push(g);
    }
    return out;
  };
  const floorNow = () => SX.hub && SX.hub.scene === "home" && SX.hub.level ? SX.hub.floor() : null;
  S.preview = function(gs, k, id) {
    const n = gs && gs.length && k ? {
      tier: H.save().tier | 0,
      k,
      id: id || "",
      set: new Set(gs),
      sig: k + ":" + (id || "") + ":" + gs.join(",")
    } : null, o = S.pv;
    if (!n && !o || n && o && n.sig === o.sig && n.tier === o.tier) return;
    S.pv = n;
    S.paint(floorNow());
  };
  const allKeys = () => H.zones().map(z => z.key);
  S.keysOf = part => {
    const ks = H.partKeys(part), zs = H.zones();
    return ks.length && ks.some(k => zs.some(z => z.key === k)) ? ks.filter(k => zs.some(z => z.key === k)) : allKeys();
  };
  S.nameOf = keys => {
    const all = H.zones();
    if (keys.length === all.length && all.length > 1) return "집 전체";
    return keys.map(k => (all.find(z => z.key === k) || {}).name || k).join(" · ");
  };
  S.buy = function(id) {
    const s = SX.game.save, e = S.BY[id];
    if (!e) return false;
    if (S.owns(id)) {
      SX.log("이미 가진 " + S.KIND[e.k] + "입니다 — 꾸미기 [바닥 · 벽] " + (e.k === "d" ? "「문」에서 고르면 됩니다" : "에서 깔면 됩니다"));
      return false;
    }
    if (s.money < e.price) {
      SX.audio.play("denied");
      SX.log("돈이 모자랍니다");
      return false;
    }
    s.money -= e.price;
    S.own().push(id);
    SX.audio.play("surfBuy");
    SX.log("샀습니다: " + e.name + " — 셸터에서 [" + SX.label("deco") + "] 꾸미기 → [바닥 · 벽] " + (e.k === "d" ? "「문」에서 모든 집에 몇 번이든 공짜로 바꾸면 됩니다" : "에서 모든 집 · 모든 칸에 몇 번이든 공짜로 깔면 됩니다"), "good");
    SX.game.persist();
    return true;
  };
  S.undoPush = function() {
    const d = H.deco;
    if (!d) return;
    const h = H.save(), T = TK(h.tier);
    if (!d.undo) d.undo = [];
    d.undo.push({
      T,
      c: JSON.stringify(h.cells && h.cells[T] || null),
      dr: S.doorId(h, T),
      ds: JSON.stringify(S.doorsOf(h, T))
    });
    if (d.undo.length > 80) d.undo.shift();
  };
  const putCells = (T, js, dr, ds) => {
    const h = H.save(), v = JSON.parse(js);
    if (!h.cells || typeof h.cells !== "object") h.cells = {};
    if (v) h.cells[T] = v; else delete h.cells[T];
    if (ds !== undefined) putDoors(h, T, JSON.parse(ds));
    if (dr !== undefined) putDoor(h, T, dr); else if (ds !== undefined) doorRetag(h, T);
  };
  const afterUndo = msg => {
    S.pv = null;
    S.paint(floorNow());
    SX.audio.play("surfPut", {
      put: ""
    });
    SX.log(msg);
    SX.game.persist();
    if (SX.ui.renderDeco) SX.ui.renderDeco();
  };
  S.undo = function() {
    const d = H.deco, h = H.save();
    if (!d || !d.undo || !d.undo.length) {
      SX.audio.play("denied");
      return false;
    }
    const e = d.undo.pop();
    if (e.T !== TK(h.tier)) return false;
    putCells(e.T, e.c, e.dr, e.ds);
    afterUndo("바닥 · 벽을 하나 되돌렸습니다" + (d.undo.length ? " — 더 되돌릴 수 있는 것 " + d.undo.length + "개" : ""));
    return true;
  };
  S.undoAll = function() {
    const d = H.deco, h = H.save();
    if (!d || d.cells0 == null) return false;
    const T = TK(h.tier);
    if (JSON.stringify(h.cells && h.cells[T] || null) === d.cells0 && S.doorId(h, T) === d.door0 && JSON.stringify(S.doorsOf(h, T)) === d.doors0) {
      SX.audio.play("denied");
      return false;
    }
    S.undoPush();
    putCells(T, d.cells0, d.door0, d.doors0);
    afterUndo("바닥 · 벽을 꾸미기를 시작할 때 모습으로 돌렸습니다 — [되돌리기]로 다시 올 수 있습니다");
    return true;
  };
  const verb = k => k === "f" ? "깔았습니다: " : k === "w" ? "발랐습니다: " : "달았습니다: ";
  const notOwned = () => {
    SX.audio.play("denied");
    SX.log("아직 안 산 것입니다 — 꾸미기 [바닥 · 벽] 아래 「한 번 사기」나 시장 가구점 「바닥재 · 벽지 · 문」에서 한 번 삽니다");
  };
  S.apply = function(keys, k, id) {
    const h = H.save(), tier = h.tier | 0, F = floorNow();
    if (!keys || !keys.length || !S.KIND[k] || !S.layout(tier)) return false;
    if (id && !S.owns(id)) {
      notOwned();
      return false;
    }
    const ok = keys.filter(key => H.zones().some(z => z.key === key)), gs = S.zoneGs(ok, k, tier);
    if (!gs.length) {
      SX.audio.play("denied");
      return false;
    }
    if (gs.every(g => S.cellId(h, tier, k, g) === (id || ""))) {
      S.preview(null);
      return false;
    }
    S.undoPush();
    S.cellPut(h, tier, k, gs, id);
    S.pv = null;
    S.paint(F);
    SX.audio.play("surfPut", {
      put: id ? S.BY[id].put : ""
    });
    S.workStart(k, id);
    const where = S.nameOf(ok), e = id ? S.BY[id] : null;
    SX.log(e ? verb(k) + e.name + " — " + where : S.KIND[k] + "를 원래대로 돌렸습니다 — " + where);
    SX.game.persist();
    if (SX.ui.renderDeco) SX.ui.renderDeco();
    return true;
  };
  S.applyCells = function(gs, k, id, quiet) {
    const h = H.save(), tier = h.tier | 0, Y = S.layout(tier);
    if (!Y || !S.KIND[k]) return 0;
    if (id && !S.owns(id)) {
      if (!quiet) notOwned();
      return 0;
    }
    const ok = gs.filter(g => g >= 0 && g < Y.N && (k === "f" ? Y.cellF[g] >= 0 : Y.cellW[g] >= 0) && S.cellId(h, tier, k, g) !== (id || ""));
    if (!ok.length) return 0;
    if (!quiet) S.undoPush();
    S.cellPut(h, tier, k, ok, id);
    S.pv = null;
    S.paint(floorNow());
    if (!quiet) {
      const e = id ? S.BY[id] : null;
      SX.audio.play("surfPut", {
        put: e ? e.put : ""
      });
      S.workStart(k, id);
      SX.log((e ? verb(k) + e.name : S.KIND[k] + "를 원래대로 돌렸습니다") + " — " + ok.length + "칸");
      SX.game.persist();
      if (SX.ui.renderDeco) SX.ui.renderDeco();
    }
    return ok.length;
  };
  S.doorBase = tier => {
    const t = H.TIERS[tier | 0];
    return t && SX.map && SX.map.homePlan ? SX.map.homePlan(t).doorSty || null : null;
  };
  function putDoor(h, T, id) {
    if (!h.door || typeof h.door !== "object") h.door = {};
    if (id) h.door[T] = id; else delete h.door[T];
    const F = floorNow();
    if (F && F.surfTier === (T | 0)) {
      F.homeDoor = id ? S.BY[id].sty || null : S.doorBase(T);
      S.doorTag(F, h);
    }
  }
  function putDoors(h, T, o) {
    if (!h.doors || typeof h.doors !== "object") h.doors = {};
    if (o && typeof o === "object" && Object.keys(o).length) h.doors[T] = o; else delete h.doors[T];
  }
  function doorRetag(h, T) {
    const F = floorNow();
    if (F && F.surfTier === (T | 0)) S.doorTag(F, h);
  }
  S.doorTag = function(F, h) {
    const Y = F && F.surfLay;
    if (!Y || !F.doors) return;
    h = h || F.surfHome || H.save();
    const T = F.surfTier | 0, all = S.doorId(h, T);
    for (const dd of F.doors) {
      if (dd.secret || !dd.tiles || !dd.tiles.length) continue;
      const i = dd.tiles[0], g = Y.gi(i % F.W - Y.o, (i / F.W | 0) - Y.o), kd = g >= 0 ? Y.kind[g] : 0;
      const key = kd === 4 ? "e" : kd === 3 && Y.doorOf[g] >= 0 ? "d" + Y.doorOf[g] : "";
      if (!key) continue;
      const one = S.doorKeyId(h, T, key), id = one !== undefined ? one : all;
      dd.hk = key;
      if (one !== undefined) dd.hsty = id ? S.BY[id].sty || null : S.doorBase(T); else delete dd.hsty;
      if (key === "e") {
        if (id) dd.hleaf = S.BY[id].sty || "wood"; else delete dd.hleaf;
      }
    }
  };
  S.doorAtXY = function(F, wx, wy) {
    if (!F || !F.doorAt || !F.surfLay) return null;
    const tx = Math.floor(wx);
    for (const ty of [ Math.floor(wy), Math.floor(wy + .75), Math.floor(wy + 1.2) ]) {
      if (!F.in(tx, ty)) continue;
      const dd = F.doorAt.get(F.i(tx, ty));
      if (dd && dd.hk && !dd.secret) return dd;
    }
    return null;
  };
  S.setDoor = function(id) {
    const h = H.save(), T = TK(h.tier), e = id ? S.BY[id] : null;
    if (id && (!e || e.k !== "d")) return false;
    if (id && !S.owns(id)) {
      notOwned();
      return false;
    }
    if (S.doorId(h, T) === (id || "") && !S.doorsOf(h, T)) return false;
    S.undoPush();
    putDoors(h, T, null);
    putDoor(h, T, id || "");
    const sty = id ? e.sty || null : S.doorBase(T), DP = SX.doorPlace;
    SX.audio.play("doorClose", {
      vol: .8,
      mat: DP && sty ? DP.MAT[sty] : null
    });
    S.workStart("d", id);
    SX.log(e ? "문을 바꿨습니다: " + e.name + " — 이 집 현관 · 방 사이 문 모두" : "문을 이 집 원래 문으로 돌렸습니다");
    SX.game.persist();
    if (SX.ui.renderDeco) SX.ui.renderDeco();
    return true;
  };
  S.setOneDoor = function(key, id) {
    const h = H.save(), T = TK(h.tier), e = id ? S.BY[id] : null;
    if (!key || id && (!e || e.k !== "d")) return false;
    if (id && !S.owns(id)) {
      notOwned();
      return false;
    }
    const one = S.doorKeyId(h, T, key), all = S.doorId(h, T);
    if ((one !== undefined ? one : all) === (id || "")) return false;
    S.undoPush();
    const o = Object.assign({}, S.doorsOf(h, T) || {});
    if ((id || "") === all) delete o[key]; else o[key] = id || "";
    putDoors(h, T, o);
    doorRetag(h, T);
    const sty = id ? e.sty || null : S.doorBase(T), DP = SX.doorPlace;
    SX.audio.play("doorClose", {
      vol: .8,
      mat: DP && sty ? DP.MAT[sty] : null
    });
    S.workStart("d", id);
    SX.log((e ? "문을 바꿨습니다: " + e.name : "문을 이 집 원래 문으로 돌렸습니다") + " — " + (key === "e" ? "현관" : "방 사이 문") + " 하나");
    SX.game.persist();
    if (SX.ui.renderDeco) SX.ui.renderDeco();
    return true;
  };
  S.choices = k => [ "" ].concat(S.IDS[k].filter(id => S.owns(id)));
  S.cycle = function(d, dir) {
    const k = d.brush && d.brush.k || "f", L = S.choices(k), at = Math.max(0, L.indexOf(d.brush ? d.brush.id : "")), n = L[(at + dir + L.length) % L.length];
    d.brush = {
      k,
      id: n
    };
    SX.audio.play("click");
    if (SX.ui.renderDeco) SX.ui.renderDeco();
  };
  S.chip = null;
  S.hoverKey = null;
  S.hoverCell = -1;
  S.hoverDoor = null;
  S.overUi = () => {
    const In = SX.input, el = document.elementFromPoint(In.mx, In.my);
    return !!el && el.id !== "screen";
  };
  S.ownCursor = () => !!(H.deco && H.deco.roomTab && !H.deco.sel);
  function strokeEnd(st) {
    const d = H.deco;
    if (!st.n) {
      if (d && d.undo && d.undo.length && st.pushed) d.undo.pop();
      return;
    }
    const e = st.id ? S.BY[st.id] : null;
    SX.log((e ? verb(st.k) + e.name : S.KIND[st.k] + "를 원래대로 돌렸습니다") + " — " + st.n + "칸");
    SX.game.persist();
    if (SX.ui.renderDeco) SX.ui.renderDeco();
  }
  S.decoTick = function(d, dt) {
    S.workTick(dt);
    S.hoverDoor = null;
    if (!d.roomTab || d.sel) {
      if (S.pv) S.preview(null);
      S.hoverKey = null;
      S.hoverCell = -1;
      d.stroke = null;
      return false;
    }
    const In = SX.input, V = SX.view, F = floorNow(), ctrl = In.down.has("ControlLeft") || In.down.has("ControlRight");
    if (!F || SX.ui.asking && SX.ui.asking()) return !!d.brush;
    const ui = S.overUi();
    if (ctrl && In.hit.has("KeyZ")) {
      S.undo();
      return true;
    }
    if (!d.brush) {
      if (S.pv) S.preview(null);
      S.hoverCell = -1;
      d.stroke = null;
      S.hoverKey = ui ? null : S.zoneAt(F, V.mouseWorldX, V.mouseWorldY);
      return false;
    }
    if (d.hover) {
      d.hover.hl = false;
      d.hover = null;
    }
    const k = d.brush.k;
    if (k === "d" && !d.cellMode) {
      d.brush = null;
      SX.ui.renderDeco();
      return false;
    }
    if (k === "d") {
      const dd = ui ? null : S.doorAtXY(F, V.mouseWorldX, V.mouseWorldY);
      S.hoverDoor = dd;
      S.hoverCell = -1;
      S.hoverKey = null;
      d.stroke = null;
      if (S.pv) S.preview(null);
      if (In.hit.has("Mouse0") && !ui) {
        if (!dd) SX.audio.play("denied"); else if (!S.setOneDoor(dd.hk, d.brush.id)) SX.audio.play("click");
      }
    } else if (d.cellMode) {
      const g = ui && !d.stroke ? -1 : S.cellAt(F, V.mouseWorldX, V.mouseWorldY, k);
      S.hoverCell = g;
      S.hoverKey = null;
      if (In.hit.has("Mouse0") && !ui) {
        if (g < 0) SX.audio.play("denied"); else if (d.brush.id && !S.owns(d.brush.id)) notOwned(); else {
          S.undoPush();
          const st = d.stroke = {
            last: g,
            n: 0,
            k,
            id: d.brush.id,
            pushed: true
          };
          st.n = S.applyCells([ g ], k, st.id, true);
          if (st.n) {
            SX.audio.play("surfPut", {
              put: st.id ? S.BY[st.id].put : ""
            });
            S.workStart(k, st.id);
          }
        }
      } else if (d.stroke && In.down.has("Mouse0") && g >= 0 && g !== d.stroke.last) {
        const st = d.stroke, n0 = st.n;
        st.n += S.applyCells(S.lineCells(F.surfLay, st.last, g), st.k, st.id, true);
        st.last = g;
        if (!n0 && st.n) {
          SX.audio.play("surfPut", {
            put: st.id ? S.BY[st.id].put : ""
          });
          S.workStart(st.k, st.id);
        }
      }
      if (d.stroke && !In.down.has("Mouse0")) {
        const st = d.stroke;
        d.stroke = null;
        strokeEnd(st);
      }
      if (d.stroke) {
        if (S.pv) S.preview(null);
      } else if (S.chip) S.preview(S.zoneGs(S.chip === "all" ? allKeys() : [ S.chip ], k), k, d.brush.id); else S.preview(g >= 0 ? [ g ] : null, k, d.brush.id);
    } else {
      const key = ui ? null : S.zoneAt(F, V.mouseWorldX, V.mouseWorldY);
      S.hoverKey = key;
      S.hoverCell = -1;
      if (S.chip) S.preview(S.zoneGs(S.chip === "all" ? allKeys() : [ S.chip ], k), k, d.brush.id); else S.preview(key ? S.zoneGs([ key ], k) : null, k, d.brush.id);
      if (In.hit.has("Mouse0") && key) {
        if (ctrl) {
          d.part = H.partToggle(d.part, key);
          SX.audio.play("click");
          SX.ui.renderDeco();
        } else S.apply([ key ], k, d.brush.id);
      } else if (In.hit.has("Mouse0") && !ui) SX.audio.play("denied");
    }
    if (In.hit.has("Mouse2")) {
      if (d.stroke) {
        const st = d.stroke;
        d.stroke = null;
        strokeEnd(st);
      }
      d.brush = null;
      S.preview(null);
      SX.audio.play("rustle");
      SX.ui.renderDeco();
      return true;
    }
    if (!d.stroke && (In.hit.has("KeyQ") || In.hit.has("KeyR") || In.wheel)) S.cycle(d, In.hit.has("KeyQ") || In.wheel < 0 ? -1 : 1);
    if (!d.stroke && k !== "d" && In.pressed("interact")) S.apply(S.keysOf(d.part), k, d.brush.id);
    return true;
  };
  S.decoEnd = function() {
    S.chip = null;
    S.hoverKey = null;
    S.hoverCell = -1;
    S.hoverDoor = null;
    S.pv = null;
    const F = floorNow();
    if (F) S.paint(F);
  };
  S.work = null;
  const TOOL = {
    paper: "brush",
    news: "brush",
    foil: "brush",
    foam: "brush",
    paint: "roller",
    chisel: "hammer",
    brick: "trowel",
    board: "hammer",
    tin: "hammer",
    tileW: "trowel",
    spray: "spray",
    rollV: "roll",
    rollC: "roll",
    rollS: "roll",
    tile: "tile",
    plank: "plank",
    trowel: "trowel",
    rollF: "roller",
    mat: "tile",
    metal: "plank",
    nail: "hammer",
    tape: "roll",
    "": "hand"
  };
  const POSE = {
    press: (t, tool) => {
      const dip = Math.round(Math.abs(Math.sin(t * Math.PI * 4)) * 2), sw = tool === "roll" ? Math.round(Math.sin(t * Math.PI * 2) * 4) : 0;
      return {
        n: [ -7 - sw, -5 + dip ],
        f: [ 7 + sw, -5 + (2 - dip) ],
        sq: .95,
        dir: 0
      };
    },
    wall: (t, tool) => {
      const s = Math.round(Math.sin(t * Math.PI * 3) * 6);
      if (tool === "spray") return {
        n: [ -6 + Math.round(Math.sin(t * Math.PI * 4) * 6), -30 ],
        f: [ 6, -18 ],
        sq: 0,
        dir: 2
      };
      if (tool === "brush") return {
        n: [ -8 + Math.round(t * 10), -28 + Math.round(Math.abs(s) / 2) ],
        f: [ 8 + Math.round(t * 4), -27 ],
        sq: 0,
        dir: 2
      };
      if (tool === "hammer" || tool === "trowel") {
        const up = Math.round(Math.abs(Math.sin(t * Math.PI * 5)) * 5);
        return {
          n: [ -4, -26 - up ],
          f: [ 5, -24 ],
          sq: 0,
          dir: 2
        };
      }
      return {
        n: [ -10, -33 + s ],
        f: [ -5, -24 + Math.round(s / 2) ],
        sq: 0,
        dir: 2
      };
    },
    base: t => {
      const up = Math.round(Math.abs(Math.sin(t * Math.PI * 4)) * 5);
      return {
        n: [ -3, -7 - up ],
        f: [ 5, -5 ],
        sq: .9,
        dir: 2
      };
    }
  };
  S.POSE = POSE;
  S.workStart = function(k, id) {
    const p = SX.actors.player;
    if (!p || !H.deco) return;
    if (S.work) S.workEnd();
    const e = id ? S.BY[id] : null, put = e ? e.put : "";
    S.work = {
      k,
      id,
      put,
      tool: k === "d" ? "hammer" : TOOL[put] || "hand",
      t: 0,
      len: k === "w" ? 1.5 : 1.3,
      x: p.x,
      y: p.y,
      hw: !!p.hideWeapon,
      col: e ? e.col : "#8a867c"
    };
    p.hideWeapon = true;
    p.reload = null;
    p.use = null;
    S.workTick(0);
  };
  S.workTick = function(dt) {
    const w = S.work, p = SX.actors.player;
    if (!w) return;
    if (!p) {
      S.work = null;
      return;
    }
    w.t += (dt || 0) / w.len;
    if (w.t >= 1) {
      S.workEnd();
      return;
    }
    const q = w.k === "f" ? POSE.press(w.t, w.tool) : w.k === "b" ? POSE.base(w.t) : POSE.wall(w.t, w.tool);
    p.x = w.x;
    p.y = w.y;
    p.moving = false;
    p.frame = 0;
    p.dir = q.dir;
    p.aim = q.dir === 0 ? Math.PI / 2 : -Math.PI / 2;
    p.squat = q.sq || 0;
    p.armPose = {
      n: q.n,
      f: q.f,
      back: true
    };
  };
  S.workEnd = function() {
    const w = S.work, p = SX.actors.player;
    S.work = null;
    if (p && w) {
      p.armPose = null;
      p.squat = 0;
      p.hideWeapon = w.hw;
    }
  };
  S.drawWork = function(ctx, cam) {
    const w = S.work, p = SX.actors.player;
    if (!w || !p || !p.armPose) return;
    const TS = SX.TS, A = SX.art, RP = A.ramp, px = Math.round(p.x * TS - cam.x), py = Math.round(p.y * TS - cam.y), duck = Math.round(Math.min(1, p.squat || 0) * 7) - (p.hop || 0);
    const hA = SX.motion && SX.motion.handAt(p, "n", cam), hx = hA ? Math.round(hA[0]) : px + p.armPose.n[0], hy = hA ? Math.round(hA[1]) : py + p.armPose.n[1] + duck, R = RP(w.col), M = RP("#8a9098"), Wd = RP("#7a5634");
    const box = (x, y, ww, hh, c, edge) => {
      ctx.fillStyle = edge;
      ctx.fillRect(x - 1, y - 1, ww + 2, hh + 2);
      ctx.fillStyle = c;
      ctx.fillRect(x, y, ww, hh);
    };
    const t = w.tool;
    if (t === "roller") {
      box(hx - 1, hy - 1, 2, 6, M[2], M[0]);
      box(hx - 5, hy - 7, 10, 4, R[3], R[0]);
      ctx.fillStyle = R[4];
      ctx.fillRect(hx - 5, hy - 7, 10, 1);
      ctx.fillStyle = M[1];
      ctx.fillRect(hx - 1, hy - 3, 2, 2);
    } else if (t === "brush") {
      box(hx - 4, hy - 2, 8, 2, Wd[3], Wd[0]);
      box(hx - 4, hy - 4, 8, 2, "#d8c890", "#7a6a40");
    } else if (t === "hammer") {
      box(hx - 1, hy - 1, 2, 6, Wd[3], Wd[0]);
      box(hx - 3, hy - 4, 6, 3, M[3], M[0]);
    } else if (t === "trowel") {
      box(hx - 1, hy - 1, 2, 3, Wd[3], Wd[0]);
      box(hx - 4, hy - 4, 8, 2, M[4], M[1]);
    } else if (t === "spray") {
      box(hx - 1, hy - 4, 3, 6, R[3], R[0]);
      ctx.fillStyle = "#e8e4d8";
      ctx.fillRect(hx, hy - 5, 1, 1);
      const g = new SX.Rng(w.t * 40 | 0);
      for (let k = 0; k < 7; k++) {
        ctx.fillStyle = R[g.i(2) ? 4 : 3];
        ctx.fillRect(hx + 2 + g.i(6), hy - 9 + g.i(6), 1, 1);
      }
    } else if (t === "roll") {
      const rx = Math.round(px - 8 + w.t * 10), ry = py + 2;
      box(rx, ry - 3, 16, 4, R[3], R[0]);
      ctx.fillStyle = R[4];
      ctx.fillRect(rx, ry - 3, 16, 1);
      ctx.fillStyle = R[1];
      ctx.fillRect(rx + 15, ry - 3, 1, 4);
    } else if (t === "tile") {
      if (w.t < .5) box(hx - 3, hy - 3, 6, 5, R[3], R[0]); else box(px - 4, py - 1, 8, 4, R[3], R[0]);
    } else if (t === "plank") {
      box(px - 9, py - 1, 18, 3, R[3], R[0]);
      ctx.fillStyle = R[4];
      ctx.fillRect(px - 9, py - 1, 18, 1);
    }
  };
  const wrap = (name, fn) => {
    const o = H[name];
    if (typeof o === "function") H[name] = fn(o);
  };
  wrap("restore", o => function() {
    return S.migrate(S.fix(o.apply(this, arguments)));
  });
  wrap("newHome", o => function() {
    const h = o.apply(this, arguments);
    h.surf = {};
    h.surfOwn = [];
    h.surfGift = [];
    h.cells = {};
    h.door = {};
    h.doors = {};
    h.cv = 1;
    return h;
  });
  wrap("updateDeco", o => function(dt) {
    const d = H.deco;
    if (d && S.decoTick(d, dt)) return;
    return o.apply(this, arguments);
  });
  wrap("stopDeco", o => function() {
    const r = o.apply(this, arguments);
    if (!H.deco) {
      S.workEnd();
      S.decoEnd();
    }
    return r;
  });
  wrap("startDeco", o => function() {
    S.pv = null;
    S.chip = null;
    S.workEnd();
    const r = o.apply(this, arguments), d = H.deco;
    if (d) {
      const h = H.save();
      d.brush = null;
      d.cellMode = !!S.lastCell;
      d.undo = [];
      d.cells0 = JSON.stringify(h.cells && h.cells[TK(h.tier)] || null);
      d.door0 = S.doorId(h, h.tier);
      d.doors0 = JSON.stringify(S.doorsOf(h, h.tier));
    }
    return r;
  });
  H.zones = () => S.zonesOf(H.save().tier);
  H.partAt = function(tx, ty) {
    const F = floorNow(), key = F ? S.zoneAt(F, tx + .5, ty + .5) : null;
    return key ? H.zones().find(z => z.key === key) || null : null;
  };
  H.targetParts = key => {
    const zs = H.zones(), ks = H.partKeys(key);
    const sel = zs.filter(z => ks.indexOf(z.key) >= 0);
    return sel.length ? sel : zs;
  };
  H.decoArea = () => null;
  H.setWall = function(col, key) {
    const id = S.wallId(col);
    return id ? S.apply(S.keysOf(key || H.deco && H.deco.part || "all"), "w", id) : false;
  };
  H.setFloor = function(fs, key) {
    const id = S.fsId(fs);
    return id ? S.apply(S.keysOf(key || H.deco && H.deco.part || "all"), "f", id) : false;
  };
  S.hoverRect = function() {
    const d = H.deco;
    if (!d || !d.roomTab || !d.brush) return null;
    const key = S.chip && S.chip !== "all" ? S.chip : S.hoverKey;
    return key ? H.zones().find(q => q.key === key) || null : null;
  };
  const outlineOf = Y => {
    if (Y.outl) return Y.outl;
    const QW = Y.W * 4, QH = (Y.HH + 1) * 4, own = new Int16Array(QW * QH).fill(-1);
    const fillQ = (gx, a, b, z) => {
      for (let qy = Math.max(0, a); qy < Math.min(QH, b); qy++) for (let qx = gx * 4; qx < gx * 4 + 4; qx++) own[qy * QW + qx] = z;
    };
    for (let gy = 0; gy < Y.HH; gy++) {
      const q0 = (gy + 1) * 4;
      for (let gx = 0; gx < Y.W; gx++) {
        const g = gy * Y.W + gx;
        if (Y.cellF[g] >= 0) fillQ(gx, q0, q0 + 4, Y.cellF[g]);
      }
      for (let gx = 0; gx < Y.W; gx++) {
        const g = gy * Y.W + gx, kd = Y.kind[g], z = Y.cellW[g];
        if (z < 0) continue;
        if (kd === 2 || kd === 4) fillQ(gx, q0 - 3, q0 + 4, z); else if (kd === 3 && Y.hz[g]) fillQ(gx, q0 - 3, q0, z);
      }
    }
    const segs = [], at = (qx, qy) => qx < 0 || qy < 0 || qx >= QW || qy >= QH ? -1 : own[qy * QW + qx];
    for (let qy = 0; qy <= QH; qy++) {
      let run = null;
      for (let qx = 0; qx <= QW; qx++) {
        const a = at(qx, qy - 1), b = at(qx, qy), on = qx < QW && a !== b;
        if (run && (!on || run[4] !== a || run[5] !== b)) {
          segs.push(run);
          run = null;
        }
        if (on) {
          if (run) run[2] = qx + 1; else run = [ qx, qy, qx + 1, qy, a, b ];
        }
      }
    }
    for (let qx = 0; qx <= QW; qx++) {
      let run = null;
      for (let qy = 0; qy <= QH; qy++) {
        const a = at(qx - 1, qy), b = at(qx, qy), on = qy < QH && a !== b;
        if (run && (!on || run[4] !== a || run[5] !== b)) {
          segs.push(run);
          run = null;
        }
        if (on) {
          if (run) run[3] = qy + 1; else run = [ qx, qy, qx, qy + 1, a, b ];
        }
      }
    }
    const fills = Y.zones.map(() => []);
    for (let qy = 0; qy < QH; qy++) {
      let z = -1, x0 = 0;
      for (let qx = 0; qx <= QW; qx++) {
        const v = qx < QW ? own[qy * QW + qx] : -1;
        if (v !== z) {
          if (z >= 0) fills[z].push([ x0, qy, qx, qy + 1 ]);
          z = v;
          x0 = qx;
        }
      }
    }
    return Y.outl = {
      segs,
      fills
    };
  };
  S.outline = tier => {
    const Y = S.layout(tier);
    return Y ? outlineOf(Y) : null;
  };
  const ZC = [ "rgba(255,96,96,0.9)", "rgba(120,230,110,0.9)", "rgba(130,160,255,0.9)", "rgba(255,160,70,0.9)", "rgba(230,120,255,0.9)", "rgba(255,120,190,0.9)", "rgba(190,230,100,0.9)", "rgba(200,170,255,0.9)", "rgba(255,140,110,0.9)" ];
  S.drawZones = function(ctx, cam, F) {
    const d = H.deco;
    if (!d || !d.roomTab || d.sel || !F || !F.surfLay || !SX.hub || SX.hub.floor() !== F) return;
    const Y = F.surfLay, TS = SX.TS, ol = outlineOf(Y), o = Y.o;
    const X = q => Math.round((q / 4 - 1 + o) * TS - cam.x), Yq = q => Math.round((q / 4 - 2 + o) * TS - cam.y);
    const sel = H.partKeys(d.part), selZ = new Set(Y.zones.filter(z => sel.indexOf(z.key) >= 0).map(z => z.k));
    const hk = d.brush && S.chip && S.chip !== "all" ? S.chip : !d.cellMode || !d.brush ? S.hoverKey : null, hz = hk ? (Y.zones.find(z => z.key === hk) || {}).k : -1;
    ctx.fillStyle = "rgba(90,220,255,0.10)";
    for (const z of selZ) for (const r of ol.fills[z]) ctx.fillRect(X(r[0]), Yq(r[1]), X(r[2]) - X(r[0]), Yq(r[3]) - Yq(r[1]));
    const line = (s, col, side, w) => {
      ctx.fillStyle = col;
      const hor = s[1] === s[3], n = w || 1;
      if (hor) {
        const y = Yq(s[1]) + (side < 0 ? -n : side > 0 ? 0 : -1);
        ctx.fillRect(X(s[0]), y, X(s[2]) - X(s[0]), n);
      } else {
        const x = X(s[0]) + (side < 0 ? -n : side > 0 ? 0 : -1);
        ctx.fillRect(x, Yq(s[1]), n, Yq(s[3]) - Yq(s[1]));
      }
    };
    for (const s of ol.segs) line(s, "rgba(8,9,12,0.6)", 0, 2);
    for (const s of ol.segs) {
      if (s[5] >= 0) line(s, ZC[s[5] % ZC.length], 1, 2);
      if (s[4] >= 0) line(s, ZC[s[4] % ZC.length], -1, 2);
    }
    for (const s of ol.segs) {
      if (selZ.has(s[5])) line(s, "rgba(90,220,255,0.95)", 1, 3);
      if (selZ.has(s[4])) line(s, "rgba(90,220,255,0.95)", -1, 3);
    }
    if (hz >= 0) for (const s of ol.segs) {
      if (s[5] === hz) {
        line(s, "rgba(255,214,90,1)", 1, 3);
      }
      if (s[4] === hz) {
        line(s, "rgba(255,214,90,1)", -1, 3);
      }
    }
    const g = d.brush && d.cellMode ? S.hoverCell : -1;
    const cur = (px, p0, pw, p1) => {
      ctx.fillStyle = "rgba(255,246,192,0.16)";
      ctx.fillRect(px, p0, pw, p1 - p0);
      ctx.fillStyle = "rgba(255,214,90,0.95)";
      ctx.fillRect(px, p0, pw, 1);
      ctx.fillRect(px, p1 - 1, pw, 1);
      ctx.fillRect(px, p0, 1, p1 - p0);
      ctx.fillRect(px + pw - 1, p0, 1, p1 - p0);
    };
    if (g >= 0) {
      const x = Y.gx(g) + o, y = Y.gy(g) + o, wl = d.brush.k !== "f", kd = Y.kind[g];
      const y0 = wl ? y - .75 : y, y1 = wl && kd === 3 ? y : y + 1;
      cur(Math.round(x * TS - cam.x), Math.round(y0 * TS - cam.y), TS, Math.round(y1 * TS - cam.y));
    }
    const hd = d.brush && d.cellMode && d.brush.k === "d" ? S.hoverDoor : null;
    if (hd) {
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
      for (const i of hd.tiles) {
        const x = i % F.W, y = i / F.W | 0;
        x0 = Math.min(x0, x);
        x1 = Math.max(x1, x);
        y0 = Math.min(y0, y);
        y1 = Math.max(y1, y);
      }
      const px = Math.round(x0 * TS - cam.x);
      cur(px, Math.round((y0 - (hd.horiz ? 1.2 : 0)) * TS - cam.y), Math.round((x1 + 1) * TS - cam.x) - px, Math.round((y1 + 1) * TS - cam.y));
    }
  };
  const esc = t => SX.esc ? SX.esc(t) : String(t);
  const mkEl = (tag, cls, txt) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  };
  const floorTiles = fs => {
    const A = SX.art, cv = A.mk(64, 64), x = cv.getContext("2d");
    for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) x.drawImage(A.floorCached(fs, i, j, i * 7 + j * 13), i * 32, j * 32);
    return cv;
  };
  const colorWall = col => {
    const A = SX.art, cv = A.mk(64, 32), x = cv.getContext("2d");
    x.drawImage(A.wallCap(0, 4 | 2, col), 0, 24, 32, 8, 0, 0, 32, 8);
    x.drawImage(A.wallCap(0, 4 | 8, col), 0, 24, 32, 8, 32, 0, 32, 8);
    x.drawImage(A.wallFront(0, 2, 1, col, 0), 0, 8);
    x.drawImage(A.wallFront(0, 3, 2, col, 0), 32, 8);
    return cv;
  };
  const fsOf = e => {
    const A = SX.art && SX.art.FS;
    return A && e.fsName && A[e.fsName] != null ? A[e.fsName] : e.fsv;
  };
  const thumbOf = (k, id, zone) => {
    const AS = SX.artSurf, c = document.createElement("canvas"), h = H.save();
    if (k === "d") {
      const e = id ? S.BY[id] : null, sty = e ? e.sty || null : S.doorBase(h.tier), DP = SX.doorPlace;
      const src = sty && DP ? DP.tall(4, 0, sty) : SX.art.doorTall(4, 0);
      c.width = src.width;
      c.height = src.height;
      c.getContext("2d").drawImage(src, 0, 0);
      c.className = "door";
      return c;
    }
    let src = null, e = id ? S.BY[id] : null;
    if (!e && zone) {
      const dv = k === "f" ? zone.dF : k === "w" ? zone.dW : zone.dB;
      if (dv) e = S.BY[dv];
    }
    if (k === "f") src = e ? e.plain ? floorTiles(fsOf(e)) : AS.thumbFloor(e.id, 2) : floorTiles(zone ? zone.fs : H.tier().floor); else if (k === "w") src = e ? e.plain ? colorWall(e.hex) : AS.thumbWall(e.id, "", 2) : colorWall((H.TIERS[h.tier | 0] || H.tier()).wall); else src = AS.thumbWall(null, e ? e.id : "", 2);
    c.width = src.width;
    c.height = src.height;
    c.getContext("2d").drawImage(src, 0, 0);
    return c;
  };
  const curOf = (zs, k) => {
    const h = H.save(), tier = h.tier | 0;
    let v;
    for (const z of zs) for (const g of k === "f" ? z.fl : z.wl) {
      const id = S.cellId(h, tier, k, g), q = id && S.owns(id) ? id : "";
      if (v === undefined) v = q; else if (v !== q) return null;
    }
    return v === undefined ? "" : v;
  };
  S.lastCell = false;
  S.hint = d => (!d.brush ? "방을 누르면 고르기(Ctrl 여러 곳) · 놓인 가구 누르면 옮기기 · 오른쪽에서 바닥재 · 벽지를 고르면 깔기 · Ctrl+Z 되돌리기 · " : d.brush.k === "d" ? "좌클릭 문 하나 바꾸기 · Ctrl+Z 되돌리기 · Q/R · 휠 다음 것 · 우클릭 그만 · " : d.cellMode ? "좌클릭 한 칸 깔기 · 누른 채 끌면 이어서 · Ctrl+Z 되돌리기 · Q/R · 휠 다음 것 · 우클릭 그만 · " : "좌클릭 방 전체 깔기 · Ctrl+좌클릭 여러 곳 고르기 · [" + SX.label("interact") + "] 고른 곳 모두 · Ctrl+Z 되돌리기 · 우클릭 그만 · ") + SX.label("deco") + "/Esc 끝";
  S.renderTab = function(body, d, U) {
    const zs = H.zones(), sel = S.keysOf(d.part), tg = zs.filter(z => sel.indexOf(z.key) >= 0), one = tg[0] || zs[0];
    const box = mkEl("div", "surfBox");
    box.dataset.surf = "1";
    box.innerHTML = `<h3><span>바닥재 · 벽지 · 문</span><span class="small">가진 것 ${S.ownN()} · 한 번 사면 공짜</span></h3>`;
    const mode = mkEl("div", "row surfMode");
    for (const [cm, nm] of [ [ false, "방 전체" ], [ true, "한 칸" ] ]) {
      const b = mkEl("button", "mini" + (!!d.cellMode === cm ? " on" : ""), nm);
      b.type = "button";
      b.dataset.cellMode = cm ? "1" : "0";
      b.onclick = () => {
        d.cellMode = cm;
        S.lastCell = cm;
        d.stroke = null;
        if (!cm && d.brush && d.brush.k === "d") d.brush = null;
        S.preview(null);
        SX.audio.play("click");
        SX.ui.renderDeco();
      };
      mode.appendChild(b);
    }
    box.appendChild(mode);
    const how = d.cellMode ? d.brush && d.brush.k === "d" ? "셸터에서 문을 누르면 그 문 하나만 바뀝니다(현관 · 방 사이 문 — 대 보면 노란 테두리) · Ctrl+Z 되돌리기 · Q/R · 휠 다음 것 · 우클릭 그만" : d.brush ? "셸터에서 칸을 누르면 그 칸만 깔립니다 · 누른 채 끌면 지나간 칸에 이어서 깔립니다(벽지 · 걸레받이는 벽 칸) · Ctrl+Z 되돌리기 · Q/R · 휠 다음 것 · 우클릭 그만" : "아래에서 하나를 고른 뒤 셸터에서 칸을 누르거나 끌면 그 칸만 깔립니다. 「기본」은 원래 모습입니다." : d.brush ? "셸터에서 방을 누르면 그 방 전체(문턱 · 문 위 벽까지)에 깔립니다(대 보면 미리 보입니다) · 위 방 단추를 눌러도 됩니다 · [" + SX.label("interact") + "] 고른 곳 모두 · Q/R · 휠 다음 것 · 우클릭 그만" : "아래에서 하나를 고른 뒤 셸터의 방(또는 위 방 단추)을 누르면 그 방 전체에 깔립니다. 「기본」은 원래 모습입니다.";
    box.appendChild(mkEl("div", "small surfHow", how));
    if (!d.buyOpen) d.buyOpen = {};
    for (const k of [ "f", "w", "b", "d" ]) {
      const dr = k === "d", h = H.save(), cur = dr ? S.doorId(h, h.tier) : curOf(tg, k), mine = S.IDS[k].filter(id => S.owns(id)), buy = S.IDS[k].filter(id => !S.owns(id));
      const hd = mkEl("div", "cat surfCat"), cn = mkEl("span", "n", String(mine.length));
      hd.append(document.createTextNode(S.KIND[k]), cn);
      box.appendChild(hd);
      if (dr) box.appendChild(mkEl("div", "small surfHow", d.cellMode ? "고른 뒤 셸터에서 문을 누르면 그 문 하나만 바뀝니다(「기본」은 이 집 원래 문 · 모든 문을 한 번에 바꾸려면 위 「방 전체」)" : "누르면 이 집 현관 · 방 사이 문이 모두 바로 바뀝니다(집마다 따로 · 「기본」은 이 집 원래 문 · 문 하나만 바꾸려면 위 「한 칸」)"));
      const grid = mkEl("div", "sfl");
      grid.dataset.kind = k;
      for (const id of S.choices(k)) {
        const e = id ? S.BY[id] : null, b = mkEl("button", "sfi" + (cur === id ? " on" : "") + ((!dr || d.cellMode) && d.brush && d.brush.k === k && d.brush.id === id ? " brush" : ""));
        b.type = "button";
        b.dataset.surf = id || "base";
        b.dataset.k = k;
        b.title = e ? e.desc : dr ? "이 집 원래 문" : "원래 모습";
        b.appendChild(thumbOf(k, id, one));
        b.appendChild(mkEl("span", "nm", e ? e.name : "기본"));
        b.onclick = dr && !d.cellMode ? () => {
          if (!S.setDoor(id)) SX.audio.play("click");
        } : () => {
          d.brush = d.brush && d.brush.k === k && d.brush.id === id ? null : {
            k,
            id
          };
          S.preview(null);
          SX.audio.play("click");
          SX.ui.renderDeco();
        };
        grid.appendChild(b);
      }
      if (!mine.length) grid.appendChild(mkEl("div", "small surfNone", "가진 " + S.KIND[k] + " 없음 — 아래 「한 번 사기」나 시장 가구점 「바닥재 · 벽지 · 문」에서 삽니다"));
      box.appendChild(grid);
      if (buy.length) {
        const open = d.buyOpen[k] != null ? d.buyOpen[k] : !mine.length;
        const tb = mkEl("button", "mini surfBuyTog" + (open ? " on" : ""), "한 번 사기 — " + S.KIND[k] + " " + buy.length + "가지 " + (open ? "▲" : "▼"));
        tb.type = "button";
        tb.dataset.buyTog = k;
        tb.onclick = () => {
          d.buyOpen[k] = !open;
          SX.audio.play("click");
          SX.ui.renderDeco();
        };
        box.appendChild(tb);
        if (open) {
          const bg = mkEl("div", "sfl sfBuy");
          bg.dataset.kind = k;
          for (const id of buy) {
            const e = S.BY[id], b = mkEl("button", "sfi buy");
            b.type = "button";
            b.dataset.buy = id;
            b.title = e.desc;
            b.appendChild(thumbOf(k, id, null));
            b.appendChild(mkEl("span", "nm", e.name));
            b.appendChild(mkEl("span", "pr", SX.won(e.price)));
            b.onclick = () => U.ask(e.name + " 구매", dr ? "한 번 사면 모든 집에서 몇 번이든 공짜로 바꿉니다." : "한 번 사면 모든 집 · 모든 칸에 몇 번이든 공짜로 깝니다.", e.price, () => {
              if (S.buy(id)) {
                if (dr && !d.cellMode) S.setDoor(id); else d.brush = {
                  k,
                  id
                };
                SX.ui.renderDeco();
              }
            });
            bg.appendChild(b);
          }
          box.appendChild(bg);
        }
      }
    }
    if (d.brush) {
      const e = d.brush.id ? S.BY[d.brush.id] : null, row = mkEl("div", "row surfAct");
      if (!d.cellMode) {
        const go = mkEl("button", "big", (e ? "「" + e.name + "」" : "「기본」(" + S.KIND[d.brush.k] + ")") + " — " + S.nameOf(sel) + "에 깔기");
        go.dataset.surfGo = "1";
        go.onclick = () => S.apply(sel, d.brush.k, d.brush.id);
        go.onmouseenter = () => {
          S.chip = sel.length === zs.length ? "all" : sel[0];
          if (sel.length > 1) S.preview(S.zoneGs(sel, d.brush.k), d.brush.k, d.brush.id);
        };
        go.onmouseleave = () => {
          S.chip = null;
          S.preview(null);
        };
        row.appendChild(go);
      }
      const st = mkEl("button", "", "그만 고르기");
      st.onclick = () => {
        d.brush = null;
        S.preview(null);
        SX.audio.play("click");
        SX.ui.renderDeco();
      };
      row.appendChild(st);
      box.appendChild(row);
    }
    const ur = mkEl("div", "row surfUndo"), nU = d.undo ? d.undo.length : 0;
    const ub = mkEl("button", "", "↶ 되돌리기" + (nU ? " " + nU : ""));
    ub.type = "button";
    ub.dataset.surfUndo = "1";
    ub.disabled = !nU;
    ub.onclick = () => S.undo();
    const ua = mkEl("button", "", "꾸미기 시작 때로");
    ua.type = "button";
    ua.dataset.surfUndoAll = "1";
    ua.disabled = !nU;
    ua.onclick = () => S.undoAll();
    ur.append(ub, ua);
    box.appendChild(ur);
    for (const b of body.querySelectorAll(".parts button[data-part]")) {
      const key = b.dataset.part, old = b.onclick;
      b.onmouseenter = () => {
        if (!d.brush) return;
        S.chip = key;
        S.preview(S.zoneGs(key === "all" ? allKeys() : [ key ], d.brush.k), d.brush.k, d.brush.id);
      };
      b.onmouseleave = () => {
        if (S.chip === key) {
          S.chip = null;
          S.preview(null);
        }
      };
      b.onclick = ev => {
        if (d.brush && !ev.ctrlKey) {
          S.chip = null;
          d.part = key;
          S.apply(key === "all" ? allKeys() : [ key ], d.brush.k, d.brush.id);
          return;
        }
        if (old) old.call(b, ev);
      };
    }
    const now = mkEl("div", "small surfNow");
    now.textContent = S.nameOf(sel) + " — " + [ "f", "w", "b" ].map(k => {
      const id = curOf(tg, k);
      return S.KIND[k] + " " + (id == null ? "여러 가지" : id ? S.BY[id].name : "기본");
    }).join(" · ");
    box.appendChild(now);
    body.appendChild(box);
  };
  S.TAB = [ "surf", "바닥재 · 벽지 · 문" ];
  S.shopRows = function(wrapEl, redraw, U) {
    wrapEl.classList.add("surfShop");
    const hd = mkEl("div", "small secHd furnSec", "바닥재 · 벽지 · 문 — 한 번 사면 모든 집 · 모든 칸에 몇 번이든 공짜로 깝니다(꾸미기 [바닥 · 벽] — 방 전체 · 한 칸 · 문은 집마다)");
    hd.style.gridColumn = "1 / -1";
    wrapEl.appendChild(hd);
    for (const k of [ "f", "w", "b", "d" ]) {
      const h = mkEl("div", "cat", S.KIND[k]);
      h.style.gridColumn = "1 / -1";
      wrapEl.appendChild(h);
      for (const id of S.IDS[k]) {
        const e = S.BY[id], own = S.owns(id), r = mkEl("div", "li surfLi");
        r.dataset.surf = id;
        const cv = thumbOf(k, id, null);
        cv.className = "thumb surfThumb" + (k === "d" ? " door" : "");
        r.appendChild(cv);
        const nm = mkEl("span", "nm");
        nm.innerHTML = esc(e.name) + ` <b class="surfPr">${esc(SX.won(e.price))}</b><br><span class="small">${esc(e.desc)}</span>`;
        r.appendChild(nm);
        const b = mkEl("button", own ? "good" : "", own ? "가진 것" : "구매");
        b.disabled = own;
        b.onclick = () => U.ask(e.name + " 구매", k === "d" ? "한 번 사면 셸터 꾸미기 [바닥 · 벽] 「문」에서 모든 집에 몇 번이든 공짜로 바꿉니다." : "한 번 사면 셸터 꾸미기 [바닥 · 벽] 에서 모든 집 · 모든 칸에 몇 번이든 공짜로 깝니다.", e.price, () => {
          if (S.buy(id)) redraw();
        });
        r.appendChild(b);
        wrapEl.appendChild(r);
      }
    }
    return wrapEl;
  };
})(window.SX);
