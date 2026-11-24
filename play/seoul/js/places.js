"use strict";

(function(SX) {
  const D = SX.data;
  const NEW = [ {
    id: "school",
    name: "고등학교",
    floors: 4,
    diff: 2,
    tag: "보통",
    enemy: 1.1,
    loot: 1.05,
    gas: .9,
    gasDmg: .8,
    cheap: .2,
    special: .18,
    layout: "classrooms",
    zShare: .75,
    desc: ""
  }, {
    id: "metro",
    name: "터미널",
    floors: 3,
    diff: 3,
    tag: "어려움",
    enemy: 1.2,
    loot: 1.35,
    gas: 1,
    gasDmg: 1,
    cheap: 0,
    special: .2,
    layout: "halls",
    dark: true,
    zShare: .62,
    desc: ""
  }, {
    id: "base",
    name: "군부대",
    floors: 4,
    diff: 4,
    tag: "최상",
    enemy: 1.35,
    loot: 1.7,
    gas: 1.2,
    gasDmg: 1,
    cheap: 0,
    special: .2,
    layout: "barracks",
    zShare: .3,
    desc: ""
  }, {
    id: "bridge",
    name: "한강 다리",
    floors: 1,
    diff: 3,
    tag: "아수라장",
    enemy: 1.15,
    loot: 1.2,
    gas: .8,
    gasDmg: 1,
    cheap: .1,
    special: .16,
    outdoor: true,
    zShare: .5,
    desc: ""
  }, {
    id: "tunnel",
    name: "지하철 터널",
    floors: 1,
    diff: 3,
    tag: "아수라장",
    enemy: .8,
    loot: 1.25,
    gas: .9,
    gasDmg: 1,
    cheap: .05,
    special: .18,
    outdoor: "tunnel",
    zShare: .6,
    desc: ""
  }, {
    id: "site",
    name: "재개발 공사장",
    floors: 1,
    diff: 3,
    tag: "아수라장",
    enemy: .9,
    loot: 1.2,
    gas: .85,
    gasDmg: 1,
    cheap: .08,
    special: .17,
    outdoor: "site",
    zShare: .45,
    desc: ""
  } ];
  for (const b of NEW) if (!D.buildings.find(q => q.id === b.id)) D.buildings.push(b);
  {
    const v = D.buildings.find(q => q.id === "villa");
    if (v) v.noBoss = true;
  }
  SX.soloMap = b => !!b && (b.floors | 0) === 1 && !b.train;
  if (!D.buildings.find(q => q.id === "train")) D.buildings.push({
    id: "train",
    name: "연습장",
    floors: 2,
    diff: 1,
    tag: "연습",
    enemy: .3,
    loot: .6,
    gas: 1,
    gasDmg: 0,
    cheap: .4,
    special: .1,
    zShare: .8,
    train: true,
    desc: "생존자들이 총과 발을 익히는 폐교 별관. 느린 감염체 몇, 가스도 봉쇄도 없습니다. 의식을 잃어도 장비는 그대로입니다."
  });
  if (!D.buildings.find(q => q.id === "heli")) D.buildings.push({
    id: "heli",
    name: "여의도 헬기장",
    floors: 5,
    diff: 4,
    tag: "마지막",
    enemy: 1.25,
    loot: 1.2,
    gas: 1,
    gasDmg: 1,
    cheap: 0,
    special: .2,
    zShare: .35,
    final: true,
    desc: ""
  });
  SX.STORY = {
    villa: {
      desc: "사태 첫 주에 비워진 다세대. 못 들고 간 살림만 남았습니다.",
      story: "봉쇄가 내려지기도 전에 주민들은 차에 실을 수 있는 것만 챙겨 떠났습니다. 반지하부터 옥탑까지 현관문이 죄다 열려 있고, 부엌엔 먹다 만 밥상이 그대로입니다. 몇 집은 끝까지 안 나갔습니다 — 문 앞에 쌓인 신발과 안에서 긁은 자국이 그걸 말해 줍니다. 남은 건 싸구려뿐이지만 조용하고, 가스도 늦게 찹니다.",
      enter: [ "현관마다 문이 열려 있습니다. 떠난 사람들은 급했나 봅니다.", "복도에 아이 신발 한 짝. 누군가는 못 떠났습니다.", "옥탑에서 라디오 소리가 납니다. 아무도 없는데." ]
    },
    office: {
      desc: "",
      story: "",
      enter: [ "", "", "" ]
    },
    mall: {
      desc: "",
      story: "",
      enter: [ "", "", "" ]
    },
    hos: {
      desc: "",
      story: "",
      enter: [ "", "", "" ]
    },
    school: {
      desc: "",
      story: "",
      enter: [ "", "", "" ]
    },
    metro: {
      desc: "",
      story: "",
      enter: [ "", "", "" ]
    },
    base: {
      desc: "",
      story: "",
      enter: [ "", "", "" ]
    },
    bridge: {
      desc: "",
      story: "",
      enter: [ "", "", "" ]
    },
    tunnel: {
      desc: "",
      story: "",
      enter: [ "", "", "" ]
    },
    site: {
      desc: "",
      story: "",
      enter: [ "", "", "" ]
    },
    train: {
      desc: "",
      story: "",
      enter: [ "", "", "" ]
    },
    heli: {
      desc: "",
      story: "",
      enter: [ "", "", "" ]
    }
  };
  SX.DIFF_TAGS = {
    villa: "적막",
    office: "위험",
    school: "위험",
    mall: "아수라장",
    metro: "아수라장",
    hos: "지옥",
    base: "지옥",
    heli: "마지막",
    train: "연습",
    bridge: "아수라장",
    tunnel: "아수라장",
    site: "아수라장"
  };
  for (const b of D.buildings) {
    const st = SX.STORY[b.id];
    if (st) {
      b.desc = st.desc;
      b.story = st.story;
      b.enter = st.enter;
    }
    if (SX.DIFF_TAGS[b.id]) b.tag = SX.DIFF_TAGS[b.id];
  }
  SX.enterLine = (b, seed) => {
    const L = b && b.enter || [];
    return L.length ? L[Math.abs(seed | 0) % L.length] : "";
  };
  SX.QUEST_LOOT = [ {
    name: "학생 생활기록부",
    val: 16e3,
    wt: 0,
    w: 1,
    h: 1,
    quest: true,
    b: "school",
    cont: [ "desk", "cabinet" ],
    p: .018,
    desc: "교무실 서랍에 있던 생활기록부. 누가 살아남았는지 찾는 데 씁니다."
  }, {
    name: "관제실 열쇠",
    val: 45e3,
    wt: 0,
    w: 1,
    h: 1,
    quest: true,
    b: "metro",
    cont: [ "desk", "locker" ],
    p: .03,
    desc: "터미널 관제실 문 열쇠. 관리실 책상이나 사물함에 있습니다."
  }, {
    name: "군 작전 지도",
    val: 6e4,
    wt: 0,
    w: 2,
    h: 1,
    quest: true,
    b: "base",
    cont: [ "desk", "cabinet" ],
    p: .02,
    desc: "부대 지휘실의 작전 지도. 탈영병들이 어디로 갔는지 적혀 있습니다."
  } ];
  for (const q of SX.QUEST_LOOT) if (!D.items.find(d => d.name === q.name)) D.items.push(q);
  SX.STORY_ITEMS = [ {
    name: "기록물 1",
    pic: "오래된 사진첩",
    desc: ""
  }, {
    name: "기록물 2",
    pic: "회사 사원증",
    desc: ""
  }, {
    name: "기록물 3",
    pic: "손때 묻은 일기장",
    desc: ""
  }, {
    name: "기록물 4",
    pic: "기밀 서류",
    desc: ""
  }, {
    name: "기록물 5",
    pic: "손때 묻은 일기장",
    desc: ""
  }, {
    name: "기록물 6",
    pic: "회사 사원증",
    desc: ""
  }, {
    name: "기록물 7",
    pic: "병원 진료기록",
    desc: ""
  }, {
    name: "기록물 8",
    pic: "기밀 서류",
    desc: ""
  }, {
    name: "기록물 9",
    pic: "종이상자",
    desc: ""
  }, {
    name: "기록물 10",
    pic: "낡은 학생증",
    desc: ""
  }, {
    name: "기록물 11",
    pic: "기밀 서류",
    desc: ""
  }, {
    name: "기록물 12",
    pic: "손때 묻은 일기장",
    desc: ""
  }, {
    name: "기록물 13",
    pic: "보조배터리",
    desc: ""
  }, {
    name: "기록물 14",
    pic: "기밀 서류",
    desc: ""
  }, {
    name: "기록물 15",
    pic: "손때 묻은 일기장",
    desc: ""
  }, {
    name: "기록물 16",
    pic: "액자",
    desc: ""
  }, {
    name: "기록물 17",
    pic: "기밀 서류",
    desc: ""
  }, {
    name: "기록물 18",
    pic: "손때 묻은 일기장",
    desc: ""
  }, {
    name: "기록물 19",
    pic: "종이상자",
    desc: ""
  } ];
  for (const q of SX.STORY_ITEMS) if (!D.items.find(d => d.name === q.name)) D.items.push(Object.assign({
    val: 0,
    wt: 0,
    w: 1,
    h: 1,
    story: true
  }, q));
  SX.ADS = {
    base: {
      brand: "광고",
      sub: "AD",
      bg: "#f2d034",
      fg: "#1c1c1c",
      acc: "#d8402a"
    },
    slots: {
      drink: null,
      soda: null,
      snack: null,
      bar: null,
      board: null,
      poster: null,
      bus: null
    }
  };
  SX.adOf = slot => Object.assign({}, SX.ADS.base, SX.ADS.slots && SX.ADS.slots[slot] || {});
  SX.AD_ITEMS = [ {
    name: "광고 음료캔",
    val: 5e3,
    wt: 10,
    w: 1,
    h: 1,
    ad: "drink",
    desc: "편의점 냉장고에 흔하던 캔 음료. 시원하지는 않지만 갈증은 풉니다."
  }, {
    name: "광고 사이다",
    val: 6e3,
    wt: 8,
    w: 1,
    h: 2,
    ad: "soda",
    desc: "김이 조금 빠진 페트병 사이다. 목마를 때 한 병이면 충분합니다."
  }, {
    name: "광고 과자",
    val: 5500,
    wt: 10,
    w: 2,
    h: 1,
    ad: "snack",
    desc: "부풀어 오른 과자 봉지. 짜서 먹고 나면 목이 마릅니다."
  }, {
    name: "광고 초코바",
    val: 4500,
    wt: 9,
    w: 1,
    h: 1,
    ad: "bar",
    desc: "주머니에 넣어 다니기 좋은 초코바. 허기를 조금 달랩니다."
  } ];
  for (const q of SX.AD_ITEMS) if (!D.items.find(d => d.name === q.name)) D.items.push(Object.assign({}, q));
  if (!D.items.find(d => d.name === "끓인 라면")) D.items.push({
    name: "끓인 라면",
    val: 11700,
    wt: 0,
    w: 1,
    h: 1,
    desc: "셸터 가스레인지에 끓인 라면. 식어도 든든합니다."
  });
  SX.VAL_FIX = {
    "끓인 라면": 1,
    "삶은 감자": 1
  };
  if (!D.items.find(d => d.name === "비상계단 열쇠")) D.items.push({
    name: "비상계단 열쇠",
    val: 4e3,
    wt: 0,
    w: 1,
    h: 1,
    desc: "잠긴 비상계단 철창을 여는 열쇠. 계단 앞에서 [F]. 한 번 쓰면 자물쇠에 꽂힌 채 남습니다."
  });
  SX.KEY_ROOMS = [ {
    b: "villa",
    room: "집주인 창고",
    key: "집주인 창고 열쇠",
    uses: 5,
    val: 9e3,
    n: 3,
    must: [],
    pool: [ "5만원권 돈다발", "명품 손목시계", "금두꺼비", "숙성 양주", "산삼 뿌리", "금목걸이" ]
  }, {
    b: "office",
    room: "사장실",
    key: "사장실 열쇠",
    uses: 4,
    val: 15e3,
    n: 3,
    must: [ "5만원권 돈다발" ],
    pool: [ "금괴", "명품 손목시계", "노트북", "숙성 양주", "금두꺼비", "5만원권 돈다발" ]
  }, {
    b: "school",
    room: "교장실",
    key: "교장실 열쇠",
    uses: 4,
    val: 15e3,
    n: 3,
    must: [ "5만원권 돈다발" ],
    pool: [ "명품 손목시계", "금두꺼비", "노트북", "산삼 뿌리", "숙성 양주", "금목걸이" ]
  }, {
    b: "mall",
    room: "귀금속 매장 금고",
    key: "귀금속 매장 열쇠",
    uses: 3,
    val: 25e3,
    n: 4,
    must: [ "다이아몬드 반지" ],
    pool: [ "금괴", "다이아몬드 반지", "명품 손목시계", "금목걸이", "5만원권 돈다발" ]
  }, {
    b: "metro",
    room: "역무실 금고",
    key: "역무실 금고 열쇠",
    uses: 3,
    val: 25e3,
    n: 4,
    must: [ "5만원권 돈다발" ],
    pool: [ "5만원권 돈다발", "금괴", "명품 손목시계", "다이아몬드 반지" ]
  }, {
    b: "hos",
    room: "약품 보관실",
    key: "약품 보관실 열쇠",
    uses: 2,
    val: 4e4,
    n: 4,
    must: [ "희귀 의약품 상자" ],
    pool: [ "희귀 의약품 상자", "수술 키트", "군용 응급 파우치", "금괴", "진통 주사기" ]
  }, {
    b: "base",
    room: "탄약고",
    key: "탄약고 열쇠",
    uses: 2,
    val: 4e4,
    n: 4,
    must: [ "야간 투시경" ],
    pool: [ "K14 저격소총", "K3 기관총", "K2C1 소총", "야간 투시경", "중전투 방탄복", "수류탄" ]
  } ];
  SX.VAULT_LOOT = [ {
    name: "금괴",
    val: 18e5,
    wt: 0,
    w: 1,
    h: 1,
    desc: "은행 띠지가 붙은 1kg 금괴. 작고 무겁고, 어디서든 값을 쳐줍니다."
  }, {
    name: "5만원권 돈다발",
    val: 1e6,
    wt: 0,
    w: 1,
    h: 1,
    desc: "고무줄로 묶은 5만 원권 스무 장. 누군가 급히 챙기려다 두고 간 돈입니다."
  }, {
    name: "다이아몬드 반지",
    val: 15e5,
    wt: 0,
    w: 1,
    h: 1,
    desc: "보증서까지 든 작은 상자. 귀금속 매장 진열장 안쪽 금고에 있던 것입니다."
  }, {
    name: "명품 손목시계",
    val: 8e5,
    wt: 0,
    w: 1,
    h: 1,
    desc: "무겁고 정확한 기계식 손목시계. 흔한 손목시계와는 값이 다릅니다."
  }, {
    name: "야간 투시경",
    val: 16e5,
    wt: 0,
    w: 2,
    h: 1,
    kind: "nvg",
    desc: "군용 야간 투시경. 전기가 끊긴 서울에서 가장 비싸게 팔리는 물건 가운데 하나입니다. 장착 창의 「투시경」 칸에 쓰고 판 안에서 켜면 밤에도 보입니다."
  }, {
    name: "희귀 의약품 상자",
    val: 12e5,
    wt: 0,
    w: 2,
    h: 1,
    desc: "봉인된 냉장 의약품 상자. 약국 어디에도 남아 있지 않은 약이 들어 있습니다."
  } ];
  for (const q of SX.VAULT_LOOT) if (!D.items.find(d => d.name === q.name)) D.items.push(Object.assign({}, q));
  for (const k of SX.KEY_ROOMS) {
    const bn = (D.buildings.find(b => b.id === k.b) || {}).name || k.b;
    if (!D.items.find(d => d.name === k.key)) D.items.push({
      name: k.key,
      val: k.val,
      wt: 0,
      w: 1,
      h: 1,
      kind: "key",
      uses: k.uses,
      usesMax: k.uses,
      room: k.room,
      b: k.b,
      desc: bn + "의 잠긴 「" + k.room + "」 문을 엽니다. 그 문 앞에서 [F] — 열 때마다 한 번씩 닳고, " + k.uses + "번 쓰면 부러집니다. 방 안 금고에는 값진 것이 들어 있습니다."
    });
  }
  SX.VAULT_KIT = n => "개인 금고 " + n + "칸";
  for (let n = 1; n <= 10; n++) (SX.OLD_NAMES || (SX.OLD_NAMES = {}))["금고 확장 키트 " + n + "칸"] = SX.VAULT_KIT(n);
  for (let n = 1; n <= 10; n++) if (!D.items.find(d => d.name === SX.VAULT_KIT(n))) D.items.push({
    name: SX.VAULT_KIT(n),
    val: n * 3e5,
    wt: 0,
    w: 1,
    h: 1,
    kind: "vaultkit",
    cells: n,
    noRaid: true,
    desc: n + "칸짜리 개인 금고. 셸터에서 우클릭으로 쓰면 가방 창에 금고가 생기고, 넣은 것은 판에서 의식을 잃어도 남습니다. 쓴 때부터 보존 기간이 지나면 금고가 사라집니다(든 것은 보관함으로). 쓰지 않고 두거나 팔 수 있습니다."
  });
  SX.NAMED_BOSSES = {
    villa: {
      id: "landlord",
      name: "집주인 최씨",
      type: "scav",
      hp: 260,
      gun: "엽총",
      guards: 1,
      drop: "최씨의 금고 장부",
      val: 9e5,
      rumor: "세입자들 짐을 다 쌓아 두고 버팁니다",
      look: {
        top: "#6a5a3a",
        topStyle: "coat",
        pants: "#3a3228",
        hat: null,
        hairStyle: "bald",
        beard: true
      }
    },
    office: {
      id: "chief",
      name: "보안실장",
      type: "scav",
      hp: 320,
      gun: "K1A 기관단총",
      armor: true,
      helmet: true,
      guards: 2,
      drop: "보안실 마스터키",
      val: 15e5,
      rumor: "보안 요원들을 데리고 층 하나를 잠갔습니다",
      look: {
        top: "#1e2430",
        topStyle: "uniform",
        pants: "#1a1c22",
        hat: "cap",
        hatCol: "#1e2430",
        vest: "#2a2a2a"
      }
    },
    mall: {
      id: "guard",
      name: "경비대장 강씨",
      type: "scav",
      hp: 380,
      gun: "K2 소총",
      armor: true,
      guards: 3,
      drop: "경비대장 무전기",
      val: 22e5,
      rumor: "아트리움 바리케이드를 쌓은 그 사람입니다",
      look: {
        top: "#2a3a5a",
        topStyle: "uniform",
        pants: "#1e2430",
        hat: "cap",
        hatCol: "#1a1e2a",
        vest: "#1a1a1a"
      }
    },
    school: {
      id: "coach",
      name: "체육 선생",
      type: "zombie",
      variant: "coach",
      hp: 900,
      drop: "체육관 호루라기",
      val: 14e5,
      rumor: "거대한 것이 호루라기를 물고 체육관을 돕니다"
    },
    metro: {
      id: "master",
      name: "역장",
      type: "zombie",
      variant: "master",
      hp: 620,
      dogs: 4,
      drop: "역장 금시계",
      val: 26e5,
      rumor: "들개 떼가 제복 입은 감염체를 따라다닙니다"
    },
    hos: {
      id: "nurse",
      name: "수간호사",
      type: "zombie",
      variant: "nurse",
      hp: 760,
      drop: "수간호사 명찰",
      val: 32e5,
      rumor: "아직 격리 병동을 순찰합니다 — 무척 빠릅니다"
    },
    bridge: {
      id: "toll",
      name: "통행료 오씨",
      type: "scav",
      hp: 420,
      gun: "USAS-12 산탄총",
      armor: true,
      helmet: true,
      guards: 3,
      drop: "통행료 장부",
      val: 28e5,
      rumor: "차 사이에서 산탄총으로 통행료를 걷습니다",
      look: {
        top: "#5a3a2a",
        topStyle: "jacket",
        pants: "#2a2a30",
        hat: "beanie",
        hatCol: "#3a2a20",
        vest: "#2a2a2a"
      }
    },
    tunnel: {
      id: "mole",
      name: "두더지",
      type: "scav",
      hp: 400,
      gun: "K1A 기관단총",
      armor: true,
      guards: 3,
      drop: "두더지의 열쇠 꾸러미",
      val: 25e5,
      rumor: "가운데 역에 진을 쳤습니다 — 어둠에서 먼저 쏩니다",
      look: {
        top: "#3e3a30",
        topStyle: "jacket",
        pants: "#26262a",
        hat: "beanie",
        hatCol: "#2a2a2a",
        vest: "#1e1e1e",
        mask: "black"
      }
    },
    site: {
      id: "boss",
      name: "현장 소장 장씨",
      type: "scav",
      hp: 430,
      gun: "K2C1 소총",
      armor: true,
      helmet: true,
      guards: 3,
      drop: "현장 소장의 금고 열쇠",
      val: 26e5,
      rumor: "안전모를 쓰고 컨테이너 사이를 돕니다",
      look: {
        top: "#c87a1e",
        topStyle: "jacket",
        pants: "#2a2c34",
        hat: "helmet",
        hatCol: "#e8c020",
        vest: "#d8d040"
      }
    },
    base: {
      id: "major",
      name: "탈영 소령",
      type: "scav",
      hp: 480,
      gun: "K3 기관총",
      armor: true,
      helmet: true,
      guards: 3,
      drop: "소령 계급장",
      val: 45e5,
      rumor: "탈영병들을 이끈 소령이 지휘실에 있습니다",
      look: {
        top: "#3a4a2a",
        topStyle: "camo",
        camo1: "#2a3a1e",
        camo2: "#5a5a3a",
        pants: "#2e3624",
        hat: "helmet",
        hatCol: "#2e3624",
        vest: "#2a3020",
        mask: "black"
      }
    }
  };
  SX.NAMED_P = .5;
  for (const b of Object.values(SX.NAMED_BOSSES)) if (!D.items.find(d => d.name === b.drop)) D.items.push({
    name: b.drop,
    val: b.val,
    wt: 0,
    w: 1,
    h: 1,
    trophy: true,
    desc: b.name + " 이(가) 지니고 있던 것. " + (b.type === "zombie" ? "감염되기 전부터" : "끝까지") + " 몸에서 떼지 않았습니다. 값이 큽니다."
  });
  SX.LOOT_FOOD = [ "참치캔", "햄 통조림", "통조림 복숭아", "생수병", "탄산수", "이온음료", "우유팩", "주스팩", "김치 한 포기", "소주 두 병", "간장 한 병", "식용유", "꿀단지", "광고 음료캔", "광고 사이다", "광고 초코바" ];
  SX.LOOT_OFFICE = [ "볼펜", "만년필", "고체 풀", "고무줄 뭉치", "충전 케이블", "마우스", "키보드", "시디 케이스", "기밀 서류", "태블릿", "노트북", "회사 사원증", "커피믹스 한 통", "보조배터리", "손목시계" ];
  SX.BOSS_GUNS = [ "M16A1 소총", "K2 소총", "K2C1 소총", "K3 기관총" ];
  SX.EGGS = [ {
    id: "villa",
    b: "villa",
    who: "uncle",
    where: "top",
    kind: "vending",
    look: "자판기 밑 살펴보기",
    hint: "연립 맨 위층 복도에 자판기 있잖아. 옛날에 동네 꼬마들이 그 밑에 뭘 숨겨 놓곤 했어. 지금도 있을까 몰라.",
    item: "동네 꼬마들의 보물 상자",
    pic: "종이상자",
    val: 25e4,
    desc: "맨 위층 자판기 밑에 숨겨져 있던 과자 상자입니다. 구슬·딱지·쪽지가 들어 있습니다. 누군가의 어린 시절입니다.",
    gift: [ "초코파이 상자", "건빵 봉지" ]
  }, {
    id: "office",
    b: "office",
    who: "courier",
    where: "f1",
    kind: "sofa",
    look: "소파 쿠션 사이 살펴보기",
    hint: "사무동 1층 로비 소파 말이야. 마지막 배송 갔을 때 쿠션 사이에 서류 봉투가 끼어 있었는데 아무도 안 빼더라. 사장님 결재 서류였대.",
    item: "사장님의 마지막 결재 서류",
    pic: "기밀 서류",
    val: 4e5,
    desc: "1층 로비 소파 쿠션 사이에 끼어 있던 결재 서류입니다. 직원 모두에게 특별 휴가를 준다는 내용입니다. 결재 날짜는 사태 당일입니다.",
    gift: [ "커피믹스 한 통", "만년필" ]
  }, {
    id: "school",
    b: "school",
    who: "teacher",
    where: "f1",
    kind: "punchBag",
    look: "샌드백 지퍼 살펴보기",
    hint: "체육관 샌드백 있잖아요. 졸업생들이 그 속에 몰래 타임캡슐을 넣어 두는 전통이 있었어요. 아직 거기 있을지도 몰라요.",
    item: "도서실 타임캡슐",
    pic: "오래된 사진첩",
    val: 3e5,
    desc: "체육관 샌드백 속에 있던 타임캡슐입니다. '10년 뒤의 우리에게'라고 적혀 있습니다.",
    gift: [ "낡은 학생증", "건전지 묶음" ]
  }, {
    id: "mall",
    b: "mall",
    who: "clerk",
    where: "f1",
    kind: "atm",
    look: "현금인출기 틈 살펴보기",
    hint: "상가 1층 현금인출기 있잖아요. 정전 나던 날 카드를 꽂은 채로 도망간 아주머니가 있었어요. 아직 거기 끼어 있으려나.",
    item: "끼어 있던 VIP 카드",
    pic: "회사 사원증",
    val: 45e4,
    desc: "상가 1층 현금인출기에 끼어 있던 금빛 카드입니다. 뒷면에 '백화점 VIP — 주차 무료'라고 적혀 있습니다.",
    gift: [ "이온음료", "탄산수" ]
  }, {
    id: "metro",
    b: "metro",
    who: "metro",
    where: "top",
    room: "hall",
    kind: "bench",
    look: "의자 밑 살펴보기",
    hint: "맨 위층 복도 의자 밑에, 마지막 근무자가 운행 일지를 두고 갔다는 얘기가 있습니다. 저는… 확인하러 갈 엄두가 안 났습니다.",
    item: "막차 운행 일지",
    pic: "손때 묻은 일기장",
    val: 35e4,
    desc: "터미널 맨 위층 의자 밑에 있던 운행 일지입니다. 마지막 줄은 '막차 정상 출발'입니다.",
    gift: [ "건전지 묶음", "LED 손전등" ]
  }, {
    id: "bridge",
    b: "bridge",
    who: "taxi",
    where: "f1",
    kind: "bus",
    look: "버스 운전석 살펴보기",
    hint: "다리 위 멈춘 버스 말이야. 버스 기사들은 운전석 해 가리개에 비상금을 꽂아 두는 버릇이 있지. 다 그래.",
    item: "버스 기사의 비상금 봉투",
    pic: "낡은 지갑",
    val: 4e5,
    desc: "멈춘 버스 운전석 해 가리개에 꽂혀 있던 봉투입니다. '딸 생일 선물'이라고 적혀 있습니다.",
    gift: [ "담배 한 갑", "생수병" ]
  }, {
    id: "tunnel",
    b: "tunnel",
    who: "foreman",
    where: "any",
    kind: "workbench",
    look: "작업대 서랍 살펴보기",
    hint: "그 터널 북쪽 기계실 작업대 있잖아. 선로 반장이 거기 공구 주머니를 두고 다녔어. 좋은 렌치였는데.",
    item: "선로 반장의 공구 주머니",
    pic: "몽키렌치",
    val: 3e5,
    desc: "기계실 작업대 서랍에 있던 가죽 공구 주머니입니다. 손잡이마다 이름이 새겨져 있습니다.",
    gift: [ "절연테이프", "청테이프" ]
  }, {
    id: "hos",
    b: "hos",
    who: "nurse",
    where: "f1",
    room: "reception",
    kind: "ivStand",
    look: "링거대 살펴보기",
    hint: "1층 접수처 링거대 있잖아요. 원장님이 거기 뭘 테이프로 붙여 두셨다는 소문이 있었어요. 다들 농담인 줄 알았지만요.",
    item: "원장님의 금 만년필",
    pic: "만년필",
    val: 5e5,
    desc: "1층 접수처 링거대에 테이프로 붙어 있던 금 만년필입니다. 수술 기록에 서명하던 펜입니다.",
    gift: [ "진통제", "붕대" ]
  }, {
    id: "site",
    b: "site",
    who: "grad",
    where: "any",
    room: "office",
    kind: "board",
    look: "칠판 뒤 살펴보기",
    hint: "그 공사장 현장 사무소 있잖아요. 제 선배가 거기서 측량 알바를 했는데, 소장이 칠판 뒤에 뭘 붙여 둔다더라고요. 비상금일 거라고요.",
    item: "현장 소장의 비상금 봉투",
    pic: "낡은 지갑",
    val: 35e4,
    desc: "현장 사무소 칠판 뒤에 테이프로 붙어 있던 봉투입니다. '인부들 회식비 — 손대지 말 것'.",
    gift: [ "청테이프", "못 한 줌" ]
  }, {
    id: "base",
    b: "base",
    who: "vet",
    where: "any",
    room: "mess",
    kind: "vending",
    look: "자판기 뒤 살펴보기",
    hint: "부대 식당 자판기 뒤에 병사들이 몰래 숨겨 둔 게 있었다. 고참들은 다 알았지. 간부만 몰랐고.",
    item: "막사의 비밀 간식 상자",
    pic: "초코파이 상자",
    val: 35e4,
    desc: "부대 식당 자판기 뒤에 숨겨져 있던 간식 상자입니다. 뚜껑에 '고참 거 손대지 마라'라고 적혀 있습니다.",
    gift: [ "군용 전투식량", "군번줄" ]
  } ];
  for (const e of SX.EGGS) if (!D.items.find(d => d.name === e.item)) D.items.push({
    name: e.item,
    val: e.val,
    wt: 0,
    w: 1,
    h: 1,
    egg: e.id,
    pic: e.pic,
    desc: e.desc
  });
  SX.eggOf = bid => SX.EGGS.find(e => e.b === bid) || null;
  SX.THROWABLES = [ {
    name: "섬광탄",
    val: 32e3,
    wt: 0,
    w: 1,
    h: 1,
    kind: "grenade",
    sub: "flash",
    radius: 7.5,
    fuse: 1.7,
    desc: "터지면 눈이 멀 만큼 밝습니다. 보이는 곳에 있던 약탈자는 5초쯤, 감염체는 2초쯤 아무것도 못 합니다. 던진 쪽을 보고 있으면 나도 눈이 멉니다."
  }, {
    name: "최루탄",
    val: 3e4,
    wt: 0,
    w: 1,
    h: 1,
    kind: "grenade",
    sub: "gas",
    radius: 3.6,
    fuse: 1.4,
    dur: 14,
    desc: "14초 동안 매운 연기를 뿜습니다. 연기 속 약탈자는 기침하며 총을 못 쏘고 밖으로 물러납니다. 감염체에게는 안 듣습니다."
  }, {
    name: "연막탄",
    val: 26e3,
    wt: 0,
    w: 1,
    h: 1,
    kind: "grenade",
    sub: "smoke",
    radius: 4.2,
    fuse: 1.2,
    dur: 18,
    desc: "18초 동안 짙은 연기로 시야를 끊습니다. 적은 연기 너머를 못 보니 못 쏩니다. 나도 연기 너머는 안 보입니다. 총알은 지나갑니다."
  } ];
  SX.THROWABLES.push({
    name: "화염병",
    val: 24e3,
    wt: 0,
    w: 1,
    h: 1,
    kind: "grenade",
    sub: "fire",
    radius: 1.5,
    fuse: 3,
    desc: "초록 소주병에 기름을 채우고 목에 천 심지를 감았습니다. 떨어진 곳에서 깨지며 둘레 바닥에 기름이 퍼지고 불이 붙습니다. 불은 나무 · 천 가구로 번지고, 불 위를 지나는 사람과 적에게도 옮겨붙습니다. 젖은 곳은 잘 타지 않습니다."
  });
  for (const t of SX.THROWABLES) if (!D.items.find(d => d.name === t.name)) D.items.push(t);
  SX.GARDEN_ITEMS = [ {
    name: "상추 씨앗",
    val: 3e3,
    wt: 2,
    w: 1,
    h: 1,
    price: 9e3,
    desc: "상추 씨앗 한 봉지. 셸터 텃밭 상자에 심어 물을 주면 1시간이면 거둡니다."
  }, {
    name: "고추 씨앗",
    val: 3500,
    wt: 2,
    w: 1,
    h: 1,
    price: 1e4,
    desc: "고추 씨앗 한 봉지. 텃밭 상자에서 2시간이면 거둡니다."
  }, {
    name: "방울토마토 씨앗",
    val: 4e3,
    wt: 2,
    w: 1,
    h: 1,
    price: 12e3,
    desc: "방울토마토 씨앗 한 봉지. 텃밭 상자에서 2시간 반이면 거둡니다."
  }, {
    name: "감자 씨눈",
    val: 4e3,
    wt: 2,
    w: 1,
    h: 1,
    price: 12e3,
    desc: "싹이 난 감자 조각. 텃밭 상자에 묻으면 3시간이면 거둡니다."
  }, {
    name: "배추 씨앗",
    val: 5e3,
    wt: 2,
    w: 1,
    h: 1,
    price: 15e3,
    desc: "배추 씨앗 한 봉지. 텃밭 상자에서 4시간이면 한 포기 거둡니다. 고추와 함께 김치를 담급니다."
  }, {
    name: "상추",
    val: 3500,
    wt: 0,
    noRaid: true,
    w: 1,
    h: 1,
    desc: "텃밭에서 막 뜯은 상추. 아삭하고 물기가 있습니다."
  }, {
    name: "고추",
    val: 2500,
    wt: 0,
    noRaid: true,
    w: 1,
    h: 1,
    desc: "텃밭에서 딴 풋고추. 맵습니다 — 먹고 나면 목이 마릅니다."
  }, {
    name: "방울토마토",
    val: 2500,
    wt: 0,
    noRaid: true,
    w: 1,
    h: 1,
    desc: "텃밭에서 딴 방울토마토 한 줌. 달고 물기가 많습니다."
  }, {
    name: "감자",
    val: 4500,
    wt: 0,
    noRaid: true,
    w: 1,
    h: 1,
    desc: "텃밭에서 캔 감자. 날로도 먹지만 삶으면 훨씬 든든합니다."
  }, {
    name: "배추",
    val: 7e3,
    wt: 0,
    noRaid: true,
    w: 1,
    h: 2,
    desc: "텃밭에서 뽑은 배추 한 포기. 고추 두 개와 김치를 담급니다."
  }, {
    name: "삶은 감자",
    val: 7800,
    wt: 0,
    noRaid: true,
    w: 1,
    h: 1,
    desc: "셸터 가스레인지에 삶은 감자. 식어도 든든합니다."
  }, {
    name: "채소 샐러드",
    val: 14500,
    wt: 0,
    noRaid: true,
    w: 2,
    h: 1,
    desc: "상추와 방울토마토를 씻어 담은 샐러드. 배도 채우고 목도 축입니다."
  }, {
    name: "지렁이",
    val: 400,
    price: 1e3,
    wt: 0,
    noRaid: true,
    w: 1,
    h: 1,
    kg: .05,
    stack: true,
    unit: "마리",
    desc: "흙에서 나온 지렁이. 낚시 미끼로 씁니다. 몇 마리든 한 칸에 모아 담습니다. 텃밭을 거둘 때 가끔 나옵니다."
  }, {
    name: "자동 급수기",
    val: 5200,
    price: 18e3,
    wt: 0,
    noRaid: true,
    w: 2,
    h: 1,
    kg: .9,
    desc: "작은 물탱크와 점적 호스 한 벌. 셸터 텃밭 상자에 달고 물탱크에 생수병을 채워 두면, 흙이 마를 때마다 알아서 물을 줍니다. 게임을 꺼 둬도 됩니다. 생수병 6병까지 들어갑니다."
  } ];
  for (const q of SX.GARDEN_ITEMS) if (!D.items.find(d => d.name === q.name)) D.items.push(q);
  {
    const med = (D.stalls || []).find(s => s.id === "med");
    if (med) {
      if (!Array.isArray(med.always)) med.always = [];
      for (const q of SX.GARDEN_ITEMS) if (q.price && !med.always.some(d => d.name === q.name)) med.always.push(q);
    }
  }
  SX.TRASH_ITEMS = [ {
    name: "폐지",
    val: 0,
    wt: 0,
    noRaid: true,
    w: 1,
    h: 1,
    kg: .03,
    stack: true,
    unit: "장",
    trash: "paper",
    desc: "셸터 바닥에서 주운 종이 · 영수증 · 신문지 · 상자 조각입니다. 값어치는 없습니다. 쓰레기 더미에 버리시면 됩니다."
  }, {
    name: "빈 캔",
    val: 0,
    wt: 0,
    noRaid: true,
    w: 1,
    h: 1,
    kg: .02,
    stack: true,
    unit: "개",
    trash: "can",
    desc: "찌그러진 음료 캔입니다. 값어치는 없습니다. 쓰레기 더미에 버리시면 됩니다."
  }, {
    name: "빈 병",
    val: 0,
    wt: 0,
    noRaid: true,
    w: 1,
    h: 1,
    kg: .3,
    stack: true,
    unit: "병",
    trash: "bottle",
    desc: "다 마신 소주병 · 맥주병입니다. 값어치는 없습니다. 쓰레기 더미에 버리시면 됩니다."
  }, {
    name: "비닐",
    val: 0,
    wt: 0,
    noRaid: true,
    w: 1,
    h: 1,
    kg: .01,
    stack: true,
    unit: "장",
    trash: "bag",
    desc: "구겨진 비닐봉지 · 과자 봉지입니다. 값어치는 없습니다. 쓰레기 더미에 버리시면 됩니다."
  }, {
    name: "잡쓰레기",
    val: 0,
    wt: 0,
    noRaid: true,
    w: 1,
    h: 1,
    kg: .05,
    stack: true,
    unit: "줌",
    trash: "misc",
    desc: "꽁초 · 병뚜껑 · 컵라면 용기 · 나무젓가락 · 걸레 조각 같은 자잘한 쓰레기입니다. 쓰레기 더미에 버리시면 됩니다."
  } ];
  for (const q of SX.TRASH_ITEMS) if (!D.items.find(d => d.name === q.name)) D.items.push(q);
  SX.TRAP_KITS = [ {
    name: "인계철선 키트",
    val: 46e3,
    wt: 0,
    w: 2,
    h: 1,
    kg: .9,
    kind: "trap",
    trap: "wire",
    smug: 62e3,
    desc: "수류탄 하나 · 가는 철사 · 말뚝 둘. 발밑에 걸어 두면 줄을 건드린 적 곁에서 수류탄이 터집니다. 줄은 양옆 벽까지 뻗습니다. 나와 우리 편 눈에만 보입니다."
  }, {
    name: "곰덫",
    val: 18e3,
    wt: 0,
    w: 2,
    h: 1,
    kg: 2.6,
    kind: "trap",
    trap: "bear",
    smug: 3e4,
    desc: "쇠 턱이 달린 사냥용 덫. 밟은 적을 물어 한동안 붙들고 다치게 합니다. 사람도 밟으면 물립니다(출혈). 나와 우리 편 눈에만 보입니다."
  } ];
  for (const t of SX.TRAP_KITS) if (!D.items.find(d => d.name === t.name)) D.items.push(t);
  {
    const gs = (D.stalls || []).find(s => s.id === "gun");
    if (gs) for (const t of SX.TRAP_KITS) if (!gs.pool.some(d => d.name === t.name)) gs.pool.push(Object.assign({}, t, {
      price: Math.round(t.val * 1.25 / 100) * 100
    }));
  }
  if (Array.isArray(D.smuggle)) for (const t of SX.TRAP_KITS) if (!D.smuggle.some(s => s.name === t.name)) D.smuggle.push({
    name: t.name,
    base: Math.round(t.smug / (1 + (D.smuggleMarkup || 12) / 100) / 100) * 100,
    item: Object.assign({}, t)
  });
  SX.FAC_PARTS = [ {
    name: "구리 전선",
    val: 4e3,
    wt: 0,
    w: 1,
    h: 1,
    kg: 1.2,
    desc: "벽과 기계에서 벗겨 낸 구리 전선 한 뭉치. 발전기를 짓거나 배선을 손볼 때 씁니다."
  }, {
    name: "소형 모터",
    val: 24e3,
    wt: 0,
    w: 1,
    h: 1,
    kg: 2,
    desc: "선풍기나 전동 공구에서 떼어 낸 작은 모터. 발전기 · 작업대를 지을 때 씁니다. 공사장 · 터미널 창고에 많습니다."
  }, {
    name: "빈 탄피 한 줌",
    val: 700,
    wt: 0,
    w: 1,
    h: 1,
    kg: .3,
    desc: "바닥에 떨어진 놋쇠 탄피 한 줌. 탄약 작업대에서 다시 채워 씁니다."
  }, {
    name: "화약 통",
    val: 28e3,
    wt: 0,
    w: 1,
    h: 1,
    kg: .7,
    desc: "사냥용 무연 화약이 든 작은 쇠통. 탄약 작업대에서 탄을 채울 때 씁니다. 군부대 무기 상자에 많습니다."
  }, {
    name: "구리 냉각관",
    val: 12e3,
    wt: 0,
    w: 2,
    h: 1,
    kg: 1.5,
    desc: "둥글게 감은 구리 관. 증류기에서 김을 식혀 술로 받아 냅니다."
  }, {
    name: "철판",
    val: 15e3,
    wt: 0,
    w: 2,
    h: 2,
    kg: 7,
    desc: "두꺼운 강철판 한 장. 무겁습니다. 금고 · 작업대를 지을 때 씁니다. 공사장에 많습니다."
  }, {
    name: "금고 다이얼",
    val: 55e3,
    wt: 0,
    w: 1,
    h: 1,
    kg: .9,
    desc: "금고 문에서 떼어 낸 번호 다이얼과 잠금 뭉치. 금고를 지을 때 귀하게 씁니다. 사무실 · 큰 건물 서랍에서 드물게 나옵니다."
  } ];
  for (const q of SX.FAC_PARTS) if (!D.items.find(d => d.name === q.name)) D.items.push(q);
  SX.FAC_LOOT = [ {
    name: "빈 탄피 한 줌",
    c: {
      crate: .12,
      locker: .08,
      trash: .1,
      desk: .04,
      cabinet: .04,
      shelf: .02,
      bag: .15,
      armory: .5
    },
    b: {
      villa: .8,
      base: 1.5,
      bridge: 1.5,
      tunnel: 1.5,
      site: 1.3
    }
  }, {
    name: "구리 전선",
    c: {
      crate: .04,
      shelf: .02,
      cabinet: .025,
      locker: .02,
      desk: .01,
      bag: .03
    },
    d: [ .7, 1, 1.2, 1.4 ],
    b: {
      site: 1.6,
      metro: 1.3,
      tunnel: 1.3
    }
  }, {
    name: "소형 모터",
    c: {
      crate: .012,
      shelf: .004,
      cabinet: .006,
      locker: .004,
      bag: .01
    },
    d: [ .3, .7, 1.1, 1.5 ],
    b: {
      site: 1.8,
      metro: 1.4,
      tunnel: 1.4,
      base: 1.2
    }
  }, {
    name: "화약 통",
    c: {
      armory: .05,
      crate: .01,
      locker: .004,
      bag: .02
    },
    d: [ 0, .5, 1, 1.4 ],
    b: {
      base: 1.5,
      site: 1.4,
      bridge: 1.3,
      tunnel: 1.3
    }
  }, {
    name: "구리 냉각관",
    c: {
      shelf: .01,
      crate: .015,
      cabinet: .01,
      medcab: .003
    },
    d: [ .6, .9, 1.1, 1.3 ]
  }, {
    name: "철판",
    c: {
      crate: .03,
      armory: .05,
      locker: .004,
      bag: .02
    },
    b: {
      site: 4,
      base: 1.5,
      bridge: 2,
      tunnel: 2,
      metro: 1.2,
      mall: .5,
      office: .5,
      school: .5,
      hos: .5,
      villa: .4
    }
  }, {
    name: "금고 다이얼",
    c: {
      desk: .01,
      cabinet: .012,
      locker: .003,
      bag: .01
    },
    d: [ .3, 1, 1.5, 2 ],
    b: {
      office: 1.4,
      mall: 1.3,
      metro: 1.3
    }
  } ];
  SX.raidLootNames = function() {
    const S = new Set, add = n => {
      if (n) S.add(typeof n === "string" ? n : n.name);
    };
    for (const L of [ D.items, D.specials, D.melee, D.mags, D.containers, D.parts || [] ]) for (const d of L || []) if (!d.noRaid) add(d);
    for (const n of [].concat(SX.LOOT_FOOD, SX.LOOT_OFFICE, SX.BOSS_GUNS, SX.LOOT_GUNS || [])) add(n);
    for (const t of SX.ENEMY_GUN_TIERS || []) for (const [n] of t) add(n);
    for (const a of SX.ARMORS || []) add(a);
    add(D.helmet);
    add("수류탄");
    add("감염체 조직");
    for (const e of SX.EGGS || []) {
      add(e.item);
      for (const n of e.gift || []) add(n);
    }
    return S;
  };
})(window.SX);
