"use strict";

(function(SX) {
  const FS = SX.art.FS, A = SX.actors, I = SX.items;
  const H = SX.home = {
    deco: null,
    STEP: 4 / 32,
    FINE: 1 / 32,
    SNAP: 2 / 32
  };
  H.TIERS = [ {
    id: 0,
    name: "고시원",
    price: 0,
    w: 8,
    h: 4,
    floor: FS.LINO,
    wall: "#6a655a",
    windows: 0,
    desc: "한 사람 눕고 끝. 옷장도 없어 옷은 구석에 쌓습니다. 그래도 방 안에 좁은 샤워 칸이 딸려 있습니다."
  }, {
    id: 1,
    name: "반지하 원룸",
    price: 2e6,
    w: 10,
    h: 5,
    floor: FS.LINO,
    wall: "#77725f",
    windows: 2,
    desc: "곰팡이 핀 반지하. 쇠창살 끼운 창 너머로 길 가는 발만 보입니다. 구석에 좁은 화장실이 붙어 있습니다."
  }, {
    id: 2,
    name: "옥탑방",
    price: 5e6,
    w: 14,
    h: 6,
    floor: FS.WOOD,
    wall: "#8f8a7c",
    windows: 3,
    desc: "지붕 위 작은 방. 상자 몇 개 놓을 자리는 납니다. 문을 열면 장독대 놓인 옥상 마당이 딸려 있습니다."
  }, {
    id: 3,
    name: "복층",
    price: 1e7,
    w: 21,
    h: 10,
    floor: FS.PARQ,
    wall: "#9a9484",
    windows: 3,
    desc: "옥탑방만 한 원룸에 좁은 계단이 있습니다. 계단을 오르면 방 너비만 한 위층이 따로 있어 침실이나 작업실로 쓰기 좋습니다."
  }, {
    id: 4,
    name: "빌라 투룸",
    price: 15e6,
    w: 13,
    h: 12,
    floor: FS.PARQ,
    wall: "#a09a88",
    windows: 3,
    desc: "거실에서 튀어나온 방 둘. 침실과 작은 방. 거실 옆으로 통유리 베란다가 붙어 있습니다."
  }, {
    id: 5,
    name: "상가 2층 통째로",
    price: 65e6,
    w: 28,
    h: 15,
    floor: FS.LOBBY,
    wall: "#8a8f94",
    windows: 3,
    desc: "옛 학원 자리. 긴 복도 양쪽으로 방이 꽉 찼습니다. 교실마다 칠판이 아직 걸려 있습니다."
  }, {
    id: 6,
    name: "한강뷰 펜트하우스",
    price: 1e8,
    w: 50,
    h: 23,
    floor: FS.MARBLE,
    wall: "#b8b2a4",
    windows: 2,
    desc: "넓은 거실에서 사방으로 뻗은 방들. 유리 난간 테라스 너머로 한강이 보입니다. 어딘가에 숨은 방이 있다는 소문이 있습니다."
  }, {
    id: 7,
    name: "민방위 대피소",
    price: 7e6,
    w: 12,
    h: 9,
    floor: FS.CONC,
    wall: "#6e7268",
    windows: 0,
    desc: "아파트 밑 민방위 대피소. 창은 없지만 철문이 두껍고, 기계실 환풍기는 아직 돕니다."
  }, {
    id: 8,
    name: "옥상 컨테이너",
    price: 25e6,
    w: 18,
    h: 12,
    floor: FS.WOOD,
    wall: "#7c8288",
    windows: 3,
    desc: "빌딩 옥상에 컨테이너 두 동을 붙였습니다. 난간 두른 마당엔 바람이 늘 붑니다."
  }, {
    id: 9,
    name: "폐역 역무실",
    price: 4e7,
    w: 28,
    h: 14,
    floor: FS.MARBLE,
    wall: "#c4c2b8",
    windows: 0,
    desc: "운행이 끊긴 지하철역의 역무실과 대합실. 개찰구 너머 승강장 스크린도어 뒤로, 양 끝을 막은 선로가 어둠에 잠겨 있습니다."
  } ];
  H.area = t => {
    const P = SX.map && SX.map.homePlan ? SX.map.homePlan(t) : null;
    return P ? P.rects.reduce((s, r) => s + (r.x1 - r.x0 + 1) * (r.y1 - r.y0 + 1), 0) : (t.w | 0) * (t.h | 0);
  };
  H.order = () => H.TIERS.slice().sort((a, b) => a.price - b.price || a.id - b.id);
  H.FURN = {
    stash: {
      name: "보관함",
      cat: "수납",
      price: 0,
      builtin: true,
      use: "stash"
    },
    clothes: {
      name: "옷더미",
      cat: "수납",
      price: 0,
      builtin: true,
      use: "wardrobe"
    },
    secretShelf: {
      name: "책장(4×4 보관)",
      cat: "수납",
      price: 0,
      builtin: true,
      grid: [ 4, 4 ]
    },
    gateEmer: {
      name: "비상 게이트",
      cat: "역 시설",
      price: 0,
      builtin: true,
      station: true
    },
    gateWide: {
      name: "넓은 게이트",
      cat: "역 시설",
      price: 0,
      builtin: true,
      station: true
    },
    gateFare: {
      name: "개찰구",
      cat: "역 시설",
      price: 0,
      builtin: true,
      station: true
    },
    gateBroke: {
      name: "부서진 개찰구",
      cat: "역 시설",
      price: 0,
      builtin: true,
      station: true
    },
    gateEnd: {
      name: "개찰구 끝 함",
      cat: "역 시설",
      price: 0,
      builtin: true,
      station: true
    },
    gateRail: {
      name: "유리 칸막이",
      cat: "역 시설",
      price: 0,
      builtin: true,
      station: true
    },
    tacStair: {
      name: "점자 블록(계단 앞)",
      cat: "역 시설",
      price: 0,
      builtin: true,
      station: true,
      flat: true,
      doorOk: true
    },
    tacRow: {
      name: "점자 블록(긴 줄)",
      cat: "역 시설",
      price: 0,
      builtin: true,
      station: true,
      flat: true,
      doorOk: true
    },
    tacLink: {
      name: "점자 블록(한 칸)",
      cat: "역 시설",
      price: 0,
      builtin: true,
      station: true,
      flat: true,
      doorOk: true
    },
    tacRow2: {
      name: "점자 블록(바깥 줄)",
      cat: "역 시설",
      price: 0,
      builtin: true,
      station: true,
      flat: true,
      doorOk: true
    },
    tacCol: {
      name: "점자 블록(세로)",
      cat: "역 시설",
      price: 0,
      builtin: true,
      station: true,
      flat: true,
      doorOk: true
    },
    radio: {
      name: "출격 지도",
      cat: "작업·사무",
      price: 3e4,
      use: "map"
    },
    goldStatue: {
      name: "황금 두목 흉상",
      cat: "고급",
      price: 5e7,
      lux: true
    },
    grandPiano: {
      name: "그랜드 피아노",
      cat: "고급",
      price: 3e7,
      lux: true
    },
    bigTank: {
      name: "대형 수족관",
      cat: "고급",
      price: 2e7,
      lux: true,
      light: true,
      lightCol: [ 120, 210, 255 ],
      lightR: 5
    },
    painting: {
      name: "명화",
      cat: "고급",
      price: 12e6,
      lux: true,
      wall: true
    },
    rug: {
      name: "러그",
      cat: "장식",
      price: 25e3,
      flat: true,
      paint: true
    },
    rugBig: {
      name: "큰 러그",
      cat: "장식",
      price: 45e3,
      flat: true,
      paint: true
    },
    armchair: {
      name: "안락의자",
      cat: "의자·탁자",
      price: 4e4,
      paint: true
    },
    sofa: {
      name: "소파",
      cat: "의자·탁자",
      price: 7e4,
      paint: true
    },
    chair: {
      name: "의자",
      cat: "의자·탁자",
      price: 12e3
    },
    coffeeTable: {
      name: "낮은 탁자",
      cat: "의자·탁자",
      price: 3e4,
      paint: true
    },
    table: {
      name: "큰 탁자",
      cat: "의자·탁자",
      price: 55e3
    },
    desk: {
      name: "책상",
      cat: "의자·탁자",
      price: 48e3
    },
    doubleBed: {
      name: "더블 침대",
      cat: "침대",
      price: 12e4,
      paint: true,
      use: "sleep"
    },
    cot: {
      name: "야전 침대",
      cat: "침대",
      price: 2e4,
      use: "sleep"
    },
    mattress: {
      name: "매트리스",
      cat: "침대",
      price: 8e3,
      flat: true,
      use: "sleep"
    },
    bookshelf: {
      name: "책장(4×4 보관)",
      cat: "수납",
      price: 6e4,
      tall: true,
      paint: true,
      use: "safe",
      grid: [ 4, 4 ]
    },
    wardrobe: {
      name: "옷장",
      cat: "수납",
      price: 9e4,
      tall: true,
      paint: true,
      use: "wardrobe"
    },
    safe: {
      name: "금고(4×4 보관)",
      cat: "수납",
      price: 28e4,
      use: "safe",
      grid: [ 4, 4 ]
    },
    locker: {
      name: "사물함(3×5 보관)",
      cat: "수납",
      price: 16e4,
      tall: true,
      use: "safe",
      grid: [ 3, 5 ]
    },
    displayCase: {
      name: "유리 진열장",
      cat: "진열",
      price: 15e4,
      use: "display",
      paint: true
    },
    displayShelf: {
      name: "진열 선반",
      cat: "진열",
      price: 95e3,
      tall: true,
      use: "display",
      paint: true
    },
    pedestal: {
      name: "전시 받침대",
      cat: "진열",
      price: 7e4,
      use: "display",
      paint: true
    },
    gunRack: {
      name: "무기 거치대",
      cat: "진열",
      price: 18e4,
      use: "rack",
      paint: true
    },
    floorLamp: {
      name: "스탠드 조명",
      cat: "불빛",
      price: 35e3,
      light: "col",
      lightR: 5,
      paint: true
    },
    neon: {
      name: "네온사인",
      cat: "불빛",
      price: 85e3,
      light: "col",
      lightR: 6,
      paint: true
    },
    heater: {
      name: "난로",
      cat: "불빛",
      price: 5e4,
      light: true,
      lightCol: [ 255, 140, 70 ],
      lightR: 4,
      flicker: true
    },
    fire: {
      name: "드럼통 모닥불",
      cat: "불빛",
      price: 2e4,
      light: true,
      lightCol: [ 255, 150, 70 ],
      lightR: 6,
      flicker: true
    },
    tv: {
      name: "텔레비전",
      cat: "가전",
      price: 11e4,
      light: true,
      lightCol: [ 150, 190, 255 ],
      lightR: 3
    },
    fridge: {
      name: "냉장고",
      cat: "주방",
      price: 8e4,
      tall: true,
      use: "fridge",
      grid: [ 6, 8 ],
      food: true
    },
    kitchen: {
      name: "싱크대·가스레인지",
      cat: "주방",
      price: 95e3,
      use: "stove"
    },
    speaker: {
      name: "스피커",
      cat: "가전",
      price: 45e3
    },
    fishTank: {
      name: "어항",
      cat: "장식",
      price: 17e4,
      light: true,
      lightCol: [ 120, 210, 255 ],
      lightR: 3
    },
    plant: {
      name: "화분",
      cat: "장식",
      price: 15e3
    },
    bigPlant: {
      name: "큰 화분",
      cat: "장식",
      price: 38e3
    },
    poster: {
      name: "거울",
      cat: "욕실",
      price: 9e3,
      paint: true
    },
    punchBag: {
      name: "샌드백",
      cat: "운동",
      price: 6e4
    },
    workbench: {
      name: "작업대",
      cat: "작업·사무",
      price: 85e3,
      use: "craft"
    },
    drum: {
      name: "드럼통",
      cat: "길거리·폐품",
      price: 6e3
    },
    bench: {
      name: "긴 의자",
      cat: "의자·탁자",
      price: 18e3
    },
    bed: {
      name: "병원 침대",
      cat: "침대",
      price: 6e4,
      use: "sleep"
    },
    counter: {
      name: "카운터",
      cat: "의자·탁자",
      price: 6e4
    },
    shelf: {
      name: "철제 선반(5×3 보관)",
      cat: "수납",
      price: 35e3,
      tall: true,
      use: "safe",
      grid: [ 5, 3 ]
    },
    cabinet: {
      name: "서랍장(4×3 보관)",
      cat: "수납",
      price: 12e4,
      use: "safe",
      grid: [ 4, 3 ]
    },
    crate: {
      name: "보급 상자(5×4 보관)",
      cat: "수납",
      price: 14e4,
      use: "safe",
      grid: [ 5, 4 ]
    },
    vending: {
      name: "자판기",
      cat: "가전",
      price: 13e4,
      tall: true,
      light: true,
      lightCol: [ 200, 230, 255 ],
      lightR: 2
    },
    copier: {
      name: "복합기",
      cat: "작업·사무",
      price: 7e4
    },
    sink: {
      name: "세면대",
      cat: "욕실",
      price: 4e4
    },
    toilet: {
      name: "변기",
      cat: "욕실",
      price: 3e4
    },
    board: {
      name: "화이트보드",
      cat: "작업·사무",
      price: 2e4
    },
    mapBoard: {
      name: "작전 지도판",
      cat: "작업·사무",
      price: 45e3
    },
    partition: {
      name: "파티션",
      cat: "작업·사무",
      price: 15e3,
      tall: true
    },
    barrier: {
      name: "바리케이드",
      cat: "길거리·폐품",
      price: 12e3
    },
    hydrant: {
      name: "소화전",
      cat: "길거리·폐품",
      price: 9e3
    },
    tree: {
      name: "나무",
      cat: "장식",
      price: 5e4
    },
    trash: {
      name: "쓰레기 더미",
      cat: "쓰레기통",
      price: 4e3,
      use: "dump"
    },
    boxes: {
      name: "박스 더미",
      cat: "길거리·폐품",
      price: 3e3
    },
    binBox: {
      name: "종이 상자 쓰레기통",
      cat: "쓰레기통",
      price: 3e3,
      use: "dump",
      desc: "라면 상자에 비닐봉지를 씌웠습니다. 급한 대로 쓰기엔 충분합니다."
    },
    binMesh: {
      name: "철망 휴지통",
      cat: "쓰레기통",
      price: 8e3,
      use: "dump",
      desc: "사무실에서 쓰던 철망 휴지통입니다. 비닐봉지를 걸어 씁니다."
    },
    binPedal: {
      name: "페달 휴지통",
      cat: "쓰레기통",
      price: 15e3,
      use: "dump",
      desc: "발로 밟으면 뚜껑이 열립니다. 냄새가 덜 납니다."
    },
    binMetal: {
      name: "철제 쓰레기통",
      cat: "쓰레기통",
      price: 25e3,
      use: "dump",
      desc: "뚜껑 달린 함석 쓰레기통입니다. 찌그러지고 녹슬었지만 튼튼합니다."
    },
    binRecycle: {
      name: "분리수거함",
      cat: "쓰레기통",
      price: 6e4,
      use: "dump",
      desc: "종이 · 캔 · 병 · 비닐을 나눠 버리는 네 칸 수거함입니다."
    },
    binWheelie: {
      name: "대형 바퀴 수거함",
      cat: "쓰레기통",
      price: 12e4,
      use: "dump",
      desc: "아파트 단지에서 끌고 온 큰 수거함입니다. 봉지가 넘칠 만큼 들어갑니다."
    },
    bathtub: {
      name: "욕조",
      cat: "욕실",
      price: 18e4
    },
    shower: {
      name: "샤워 부스",
      cat: "욕실",
      price: 14e4,
      tall: true
    },
    washer: {
      name: "세탁기",
      cat: "욕실",
      price: 12e4
    },
    bathCabinet: {
      name: "욕실 수납장(거울)",
      cat: "욕실",
      price: 45e3,
      wall: true
    },
    cupboard: {
      name: "찬장",
      cat: "주방",
      price: 11e4,
      tall: true,
      paint: true
    },
    diningTable: {
      name: "식탁",
      cat: "의자·탁자",
      price: 9e4,
      paint: true
    },
    prepCounter: {
      name: "조리대",
      cat: "주방",
      price: 85e3,
      paint: true,
      use: "cook"
    },
    microwave: {
      name: "전자레인지(장)",
      cat: "주방",
      price: 6e4
    },
    waterCooler: {
      name: "정수기",
      cat: "주방",
      price: 7e4,
      use: "water",
      cap: 4
    },
    waterStand: {
      name: "스탠드 정수기",
      cat: "주방",
      price: 16e4,
      use: "water",
      cap: 10,
      desc: "바닥에 세우는 큰 정수기입니다. 18.9리터 큰 통을 거꾸로 꽂아 두어 물이 넉넉합니다."
    },
    singleBed: {
      name: "싱글 침대",
      cat: "침대",
      price: 7e4,
      paint: true,
      use: "sleep"
    },
    bunkBed: {
      name: "이층 침대",
      cat: "침대",
      price: 13e4,
      tall: true,
      paint: true,
      use: "sleep"
    },
    nightstand: {
      name: "협탁",
      cat: "의자·탁자",
      price: 3e4,
      paint: true
    },
    dresser: {
      name: "서랍장(높은)",
      cat: "수납",
      price: 75e3,
      paint: true
    },
    vanity: {
      name: "화장대",
      cat: "의자·탁자",
      price: 95e3,
      paint: true
    },
    coatRack: {
      name: "옷걸이 스탠드",
      cat: "수납",
      price: 25e3,
      tall: true
    },
    clock: {
      name: "벽시계",
      cat: "장식",
      price: 15e3,
      paint: true,
      wall: true
    },
    fan: {
      name: "선풍기",
      cat: "가전",
      price: 35e3
    },
    aircon: {
      name: "벽걸이 에어컨",
      cat: "가전",
      price: 14e4,
      wall: true
    },
    opTable: {
      name: "수술대",
      cat: "병원",
      price: 9e4
    },
    ivStand: {
      name: "링거대",
      cat: "병원",
      price: 2e4,
      tall: true
    },
    o2: {
      name: "산소통",
      cat: "병원",
      price: 25e3
    },
    atm: {
      name: "현금 인출기",
      cat: "가전",
      price: 2e5,
      tall: true,
      light: true,
      lightCol: [ 120, 200, 255 ],
      lightR: 2
    },
    sign: {
      name: "간판",
      cat: "불빛",
      price: 4e4,
      light: true,
      lightCol: [ 255, 200, 120 ],
      lightR: 3
    },
    lamp: {
      name: "가로등",
      cat: "불빛",
      price: 8e4,
      tall: true,
      light: true,
      lightCol: [ 255, 220, 160 ],
      lightR: 7
    },
    ac: {
      name: "에어컨 실외기",
      cat: "길거리·폐품",
      price: 3e4
    },
    tank: {
      name: "물탱크",
      cat: "길거리·폐품",
      price: 6e4,
      tall: true
    },
    treadmill: {
      name: "러닝머신",
      cat: "운동",
      price: 25e4
    },
    barbell: {
      name: "벤치·바벨",
      cat: "운동",
      price: 22e4
    },
    ropeMat: {
      name: "줄넘기 매트",
      cat: "운동",
      price: 4e4,
      flat: true
    },
    planter: {
      name: "텃밭 상자",
      cat: "텃밭·생수",
      price: 15e4,
      use: "garden",
      plots: 1
    },
    planterBig: {
      name: "큰 텃밭 상자(3칸)",
      cat: "텃밭·생수",
      price: 4e5,
      use: "garden",
      plots: 3
    },
    waterPack: {
      name: "생수 묶음",
      cat: "텃밭·생수",
      price: 2e4,
      use: "safe",
      grid: [ 3, 4 ],
      water: true
    },
    waterBoxes: {
      name: "생수 상자 더미",
      cat: "텃밭·생수",
      price: 25e3,
      use: "safe",
      grid: [ 5, 4 ],
      water: true
    },
    bottleSack: {
      name: "빈 페트병 자루",
      cat: "텃밭·생수",
      price: 6e3
    },
    bottleWall: {
      name: "물병 걸이",
      cat: "텃밭·생수",
      price: 18e3,
      wall: true,
      use: "safe",
      grid: [ 3, 2 ],
      water: true
    },
    waterPallet: {
      name: "생수 팔레트",
      cat: "텃밭·생수",
      price: 12e4,
      use: "safe",
      grid: [ 10, 8 ],
      water: true
    },
    waterShelf: {
      name: "생수 진열 선반",
      cat: "텃밭·생수",
      price: 9e4,
      tall: true,
      use: "safe",
      grid: [ 8, 6 ],
      water: true
    },
    waterJugRack: {
      name: "말통 거치대",
      cat: "텃밭·생수",
      price: 7e4,
      use: "safe",
      grid: [ 4, 4 ],
      water: true
    },
    waterCase: {
      name: "냉장 쇼케이스(생수)",
      cat: "텃밭·생수",
      price: 16e4,
      tall: true,
      light: true,
      lightCol: [ 190, 225, 255 ],
      lightR: 2,
      use: "safe",
      grid: [ 6, 8 ],
      water: true
    }
  };
  H.GROUPS = [ {
    id: "seat",
    name: "의자·탁자"
  }, {
    id: "bed",
    name: "침대"
  }, {
    id: "storage",
    name: "수납"
  }, {
    id: "display",
    name: "진열"
  }, {
    id: "kitchen",
    name: "주방"
  }, {
    id: "bath",
    name: "욕실"
  }, {
    id: "appliance",
    name: "가전"
  }, {
    id: "light",
    name: "불빛"
  }, {
    id: "deco",
    name: "장식"
  }, {
    id: "work",
    name: "작업·사무"
  }, {
    id: "sport",
    name: "운동"
  }, {
    id: "garden",
    name: "텃밭·생수"
  }, {
    id: "bin",
    name: "쓰레기통"
  }, {
    id: "hospital",
    name: "병원"
  }, {
    id: "street",
    name: "길거리·폐품"
  }, {
    id: "lux",
    name: "고급"
  } ];
  H.ROOMS = [];
  H.groupOf = function(kind) {
    const c = H.FURN[kind];
    if (!c) return null;
    const g = H.GROUPS.find(q => q.name === c.cat);
    return g ? g.id : "cat:" + c.cat;
  };
  H.shopGroups = function(hasArt) {
    const out = H.GROUPS.map(g => ({
      id: g.id,
      name: g.name,
      list: []
    })), by = new Map(out.map(g => [ g.id, g ]));
    for (const [k, c] of Object.entries(H.FURN)) {
      if (c.builtin || hasArt && !hasArt(k)) continue;
      const id = H.groupOf(k);
      if (!by.has(id)) {
        const g = {
          id,
          name: c.cat,
          list: []
        };
        out.push(g);
        by.set(id, g);
      }
      by.get(id).list.push([ k, c ]);
    }
    for (const g of out) g.list.sort(([ka, a], [kb, b]) => (a.price || 0) - (b.price || 0) || String(a.name).localeCompare(String(b.name), "ko") || (ka < kb ? -1 : ka > kb ? 1 : 0));
    return out;
  };
  H.groupTabs = hasArt => H.shopGroups(hasArt).filter(g => g.list.length).map(g => [ g.id, g.name ]);
  H.decoGroups = function(furns, hasArt) {
    const sg = H.shopGroups(hasArt), ord = new Map, out = sg.map(g => ({
      id: g.id,
      name: g.name,
      list: []
    })), by = new Map(out.map(g => [ g.id, g ]));
    sg.forEach(g => g.list.forEach(([k], i) => ord.set(k, i)));
    for (const f of furns || []) {
      const c = H.FURN[f.kind];
      if (!c) continue;
      const id = H.groupOf(f.kind);
      if (!by.has(id)) {
        const g = {
          id,
          name: c.cat,
          list: []
        };
        out.push(g);
        by.set(id, g);
      }
      by.get(id).list.push(f);
    }
    const at = f => ord.has(f.kind) ? ord.get(f.kind) : -1;
    for (const g of out) g.list.sort((a, b) => at(a) - at(b) || (a.kind < b.kind ? -1 : a.kind > b.kind ? 1 : 0));
    return out.filter(g => g.list.length);
  };
  H.builtinSpots = tier => (tier | 0) === 0 ? [ [ "stash", 0, 0 ], [ "clothes", -1, 0 ] ] : (tier | 0) === 3 ? [ [ "stash", 0, 0 ], [ "wardrobe", -2, 0 ] ] : [ [ "stash", 0, 0 ], [ "wardrobe", -1, 0 ] ];
  H.STATION_TIER = 9;
  H.STATION = [ [ "g0", "gateEmer", 6, 10 ], [ "g1", "gateWide", 7, 10 ], [ "g2", "gateFare", 8, 10 ], [ "g3", "gateFare", 9, 10, 1 ], [ "g4", "gateBroke", 10, 10 ], [ "g5", "gateFare", 11, 10, 2 ], [ "g6", "gateFare", 12, 10, 3 ], [ "g7", "gateEnd", 13, 10 ], [ "r0", "gateRail", 14, 10 ], [ "r1", "gateRail", 15, 10, 2 ], [ "r2", "gateRail", 16, 10 ], [ "r3", "gateRail", 17, 10, 2 ], [ "r4", "gateRail", 18, 10 ], [ "r5", "gateRail", 19, 10, 2 ], [ "r6", "gateRail", 20, 10 ], [ "r7", "gateRail", 21, 10, 2 ], [ "t0", "tacStair", 9, 8 ], [ "t1", "tacStair", 17, 8 ], [ "t2", "tacRow", 7, 9 ], [ "t3", "tacLink", 7, 10 ], [ "t4", "tacRow2", 7, 11 ], [ "t5", "tacCol", 13, 12 ] ];
  H.builtinKinds = tier => {
    const o = H.builtinSpots(tier).map(b => b[0]);
    if ((tier | 0) === H.STATION_TIER) for (const e of H.STATION) if (!o.includes(e[1])) o.push(e[1]);
    return o;
  };
  H.ensureBuiltin = function(home) {
    for (const [k] of H.builtinSpots(home.tier | 0)) if (!home.furn.some(f => f.kind === k && f.builtin)) home.furn.push({
      id: home.nextId++,
      kind: k,
      builtin: true,
      placed: false
    });
    if ((home.tier | 0) === H.STATION_TIER) for (const [st, k, , , v] of H.STATION) if (!home.furn.some(f => f.builtin && f.st === st)) home.furn.push({
      id: home.nextId++,
      kind: k,
      builtin: true,
      placed: false,
      st,
      v: v | 0
    });
    if ((home.tier | 0) === 6 && !home.furn.some(f => f.kind === "secretShelf")) home.furn.push({
      id: home.nextId++,
      kind: "secretShelf",
      builtin: true,
      placed: false
    });
  };
  H.migrateHome = function(h) {
    if (!h || typeof h !== "object" || (h.hv | 0) >= 2) return h;
    const MAP = {
      0: 1,
      1: 2,
      2: 4,
      3: 5,
      4: 6
    }, mp = n => MAP[n | 0] != null ? MAP[n | 0] : 1;
    const oldOwned = Array.isArray(h.owned) ? h.owned.map(n => n | 0) : [ h.tier | 0 ];
    h.tier = mp(h.tier);
    const owned = [ 0 ];
    for (const n of oldOwned) {
      const m = mp(n);
      if (!owned.includes(m)) owned.push(m);
      if (n === 2 && !owned.includes(3)) owned.push(3);
    }
    if (!owned.includes(h.tier)) owned.push(h.tier);
    h.owned = owned.sort((a, b) => a - b);
    if (h.layouts && typeof h.layouts === "object") {
      const L = {};
      for (const k in h.layouts) L[mp(k)] = h.layouts[k];
      h.layouts = L;
    }
    for (const f of Array.isArray(h.furn) ? h.furn : []) if (f && f.kind === "radio" && f.builtin) f.builtin = false;
    h.hv = 2;
    return h;
  };
  H.PAINT = [ "#8a3a32", "#b85a2a", "#c8a040", "#5a6a2a", "#2f6a4a", "#2a5a6a", "#3a4a7a", "#5a3a7a", "#8a4a6a", "#e8e0d0", "#8a8a84", "#3a3a3a", "#6a4a2a", "#a07850", "#ff6ab4", "#4ae0ff", "#9aff5a", "#ffd23a" ];
  H.WALLS = [ [ "#77725f", "곰팡이 회벽" ], [ "#a09a88", "베이지" ], [ "#b8b2a4", "밝은 회색" ], [ "#8a6a5a", "벽돌빛" ], [ "#5a6a5a", "짙은 녹색" ], [ "#5a647a", "푸른 회색" ], [ "#8a7a9a", "연보라" ], [ "#c8b890", "크림" ], [ "#4a4642", "숯색" ], [ "#9a5a4a", "벽돌" ] ];
  H.FLOORS = [ [ FS.LINO, "장판" ], [ FS.WOOD, "나무 마루" ], [ FS.PARQ, "쪽마루" ], [ FS.TILE, "타일" ], [ FS.CHECK, "체크 타일" ], [ FS.CARPET, "카펫" ], [ FS.CONC, "콘크리트" ], [ FS.LOBBY, "석재" ], [ FS.MARBLE, "대리석" ] ];
  H.PRICE = {
    paint: 5e3,
    wall: 1500,
    floor: 3e3
  };
  const partsCache = {};
  H.partsOf = function(tier) {
    tier = tier | 0;
    if (partsCache[tier]) return partsCache[tier];
    const t = H.TIERS[tier] || H.TIERS[0], P = SX.map.homePlan(t), o = SX.map.HOME_MG + 1, out = [];
    const roomAt = (x, y) => P.rects.findIndex(r => x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1);
    P.rects.forEach((r, k) => out.push({
      key: "r" + k,
      door: false,
      name: r.name,
      n: (r.x1 - r.x0 + 1) * (r.y1 - r.y0 + 1),
      x0: o + r.x0,
      y0: o + r.y0,
      x1: o + r.x1,
      y1: o + r.y1,
      fs: r.fs != null ? r.fs : null,
      surf: r.surf || null
    }));
    P.doors.forEach((d, k) => {
      const hz = d.horiz !== false, len = d.len || 2;
      const a = hz ? roomAt(d.x, d.y - 1) : roomAt(d.x - 1, d.y), b = hz ? roomAt(d.x, d.y + 1) : roomAt(d.x + 1, d.y), side = a > 0 ? a : b;
      const nm = side >= 0 && P.rects[side] ? P.rects[side].name + " 문턱" : "문턱";
      out.push({
        key: "d" + k,
        door: true,
        name: nm,
        n: len,
        x0: o + d.x,
        y0: o + d.y,
        x1: o + d.x + (hz ? len - 1 : 0),
        y1: o + d.y + (hz ? 0 : len - 1),
        fs: null
      });
    });
    return partsCache[tier] = out;
  };
  H.parts = () => H.partsOf(H.save().tier);
  H.partWall = function(p, h) {
    h = h || H.save();
    const o = h.rooms && h.rooms[p.key], t = H.TIERS[h.tier | 0] || H.TIERS[0];
    return o && o.wall || h.wall || t.wall;
  };
  H.partFloor = function(p, h) {
    h = h || H.save();
    const o = h.rooms && h.rooms[p.key], t = H.TIERS[h.tier | 0] || H.TIERS[0];
    if (o && o.floor != null) return o.floor;
    if (p.door) {
      const main = H.partsOf(h.tier | 0)[0];
      return main && !main.door ? H.partFloor(main, h) : FS.CONC;
    }
    return h.floor != null ? h.floor : p.fs != null ? p.fs : t.floor;
  };
  H.partAt = (tx, ty) => H.parts().find(p => tx >= p.x0 && tx <= p.x1 && ty >= p.y0 && ty <= p.y1) || null;
  H.partKeys = key => !key || key === "all" ? [] : String(key).split(",").filter(Boolean);
  H.partToggle = (cur, key) => {
    const ks = H.partKeys(cur), i = ks.indexOf(key);
    if (i >= 0) ks.splice(i, 1); else ks.push(key);
    return ks.length ? ks.join(",") : "all";
  };
  H.targetParts = key => {
    const all = H.parts(), ks = H.partKeys(key);
    return !ks.length ? all : all.filter(p => ks.indexOf(p.key) >= 0);
  };
  H.targetPrice = (key, what) => H.targetParts(key).reduce((s, p) => s + p.n, 0) * H.PRICE[what];
  H.decoArea = function() {
    const d = H.deco;
    if (!d || !d.roomTab) return null;
    const ks = H.partKeys(d.part);
    if (!ks.length) return null;
    const ps = H.parts().filter(q => ks.indexOf(q.key) >= 0);
    return ps.length ? ps : null;
  };
  H.newHome = () => ({
    tier: 0,
    hv: 2,
    plv: 2,
    dpx: 2,
    floor: null,
    floorCol: null,
    wall: null,
    rooms: {},
    furn: [ {
      id: 1,
      kind: "mattress",
      placed: false
    } ],
    nextId: 2,
    loose: []
  });
  H.save = () => SX.game.save.home;
  H.tier = () => H.TIERS[H.save().tier] || H.TIERS[0];
  H.buy = function(kind) {
    const s = SX.game.save, cat = H.FURN[kind];
    if (!cat) return false;
    if (s.money < cat.price) {
      SX.audio.play("denied");
      SX.log("돈이 모자랍니다");
      return false;
    }
    s.money -= cat.price;
    const f = {
      id: s.home.nextId++,
      kind,
      placed: false
    };
    if (cat.grid) f.grid = I.gridDump(I.grid(cat.grid[0], cat.grid[1]));
    s.home.furn.push(f);
    SX.audio.play("buy");
    SX.log("샀습니다: " + cat.name + " — 셸터에서 [" + SX.label("deco") + "] 꾸미기로 놓으시면 됩니다");
    SX.game.persist();
    return true;
  };
  H.owned = () => {
    const h = H.save();
    if (!Array.isArray(h.owned)) h.owned = [ h.tier | 0 ];
    if (!h.owned.includes(h.tier | 0)) h.owned.push(h.tier | 0);
    return h.owned;
  };
  H.owns = id => H.owned().includes(id);
  H.moveTo = function(id) {
    const s = SX.game.save, t = H.TIERS[id];
    if (!t) return false;
    if (id === s.home.tier) {
      SX.log("지금 사는 곳입니다");
      return false;
    }
    const own = H.owns(id);
    if (!own && s.money < t.price) {
      SX.audio.play("denied");
      SX.log("돈이 모자랍니다");
      return false;
    }
    if (!own) {
      s.money -= t.price;
      H.owned().push(id);
    }
    H.snapshotLayout();
    s.home.tier = id;
    H.pruneLayouts(s.home);
    const gone = H.loadLayout(id), back = s.home.furn.filter(f => f.placed && !f.builtin).length;
    SX.audio.play("buy");
    SX.log("🏠 " + t.name + "(으)로 이사했습니다 — " + (back ? "놓아 뒀던 가구 " + back + "개를 그 자리에 다시 놓았습니다 · 나머지는 창고에 있습니다" : "가구는 모두 창고에 있습니다. [" + SX.label("deco") + "] 꾸미기로 놓으시면 됩니다"), "good");
    if (gone) SX.log("🏠 없어진 가구 " + gone + "개 — 그사이 팔거나 버린 가구라 그 자리는 비워 뒀습니다");
    SX.game.persist();
    if (SX.hub.scene === "home") SX.hub.rebuild();
    return true;
  };
  function copyRooms(rm) {
    const out = {};
    if (!rm || typeof rm !== "object") return out;
    for (const k in rm) {
      const o = rm[k];
      if (!/^[rd]\d+$/.test(k) || !o || typeof o !== "object") continue;
      const q = {};
      if (typeof o.wall === "string" && o.wall) q.wall = o.wall;
      if (typeof o.floor === "number") q.floor = o.floor | 0;
      if (q.wall != null || q.floor != null) out[k] = q;
    }
    return out;
  }
  H.snapshotLayout = function() {
    const h = H.save();
    if (!h.layouts) h.layouts = {};
    h.layouts[h.tier] = {
      placed: h.furn.filter(f => f.placed).map(f => ({
        id: f.id,
        x: f.x,
        y: f.y,
        rot: f.rot | 0,
        on: SX.ride ? SX.ride.toLayout(f) : undefined
      })),
      stored: h.furn.filter(f => f.builtin && !f.placed && f.stored).map(f => f.id),
      wall: h.wall || null,
      floor: h.floor == null ? null : h.floor,
      floorCol: h.floorCol || null,
      rooms: copyRooms(h.rooms)
    };
  };
  H.hasLayout = tier => {
    const Ls = H.save().layouts;
    return !!(Ls && typeof Ls === "object" && Ls[tier]);
  };
  H.loadLayout = function(tier) {
    const h = H.save(), L = (h.layouts || {})[tier];
    let gone = 0;
    for (const f of h.furn) f.placed = false;
    if (L) {
      gone = Math.max(0, L.gone | 0);
      const keep = [], seen = new Set;
      for (const e of Array.isArray(L.placed) ? L.placed : []) {
        const f = e && !seen.has(e.id) ? h.furn.find(q => q.id === e.id) : null;
        if (!f) {
          if (e && !seen.has(e.id)) gone++;
          continue;
        }
        seen.add(e.id);
        keep.push(e);
        f.placed = true;
        f.x = e.x;
        f.y = e.y;
        f.rot = e.rot | 0;
        if (SX.ride) SX.ride.fromLayout(f, e);
      }
      L.placed = keep;
      delete L.gone;
      if (Array.isArray(L.stored)) for (const f of h.furn) if (f.builtin && !f.placed) {
        if (L.stored.includes(f.id)) f.stored = 1; else delete f.stored;
      }
    }
    h.wall = L ? L.wall : null;
    h.floor = L ? L.floor : null;
    h.floorCol = L ? L.floorCol : null;
    h.rooms = L ? copyRooms(L.rooms) : {};
    return gone;
  };
  H.pruneLayouts = function(h) {
    h = h || H.save();
    const Ls = h.layouts;
    if (!Ls || typeof Ls !== "object") return 0;
    let n = 0;
    for (const k in Ls) {
      const t = H.TIERS[k | 0], L = Ls[k];
      if (!t || !L || !Array.isArray(L.placed)) {
        delete Ls[k];
        n++;
        continue;
      }
      L.placed = L.placed.filter(e => {
        const f = e && (h.furn || []).find(q => q.id === e.id);
        if (!f && e) L.gone = (L.gone | 0) + 1;
        const ok = !!f && (!!e.on && !!SX.ride && !!SX.ride.KINDS[f.kind] || !!(SX.map && SX.map.homeFits) && SX.map.homeFits(t, f.kind, e.x, e.y, e.rot | 0));
        if (!ok) n++;
        return ok;
      });
    }
    return n;
  };
  H.inOtherLayout = function(f) {
    const h = H.save(), Ls = h.layouts;
    if (!f || !Ls || typeof Ls !== "object") return false;
    for (const t in Ls) {
      if ((t | 0) === (h.tier | 0)) continue;
      const L = Ls[t];
      if (L && Array.isArray(L.placed) && L.placed.some(e => e && e.id === f.id)) return true;
    }
    return false;
  };
  H.unplaced = () => {
    const h = H.save(), kinds = H.builtinKinds(h.tier | 0);
    return h.furn.filter(f => !f.placed && !(f.builtin && !kinds.includes(f.kind)));
  };
  H.overflow = function() {
    const h = H.save(), out = [];
    for (const f of h.furn) {
      if (f.placed) continue;
      if (f.kind === "secretShelf" && (h.tier | 0) === 6) continue;
      const cat = H.FURN[f.kind];
      if (!cat) continue;
      let grid = null;
      if (cat.grid) {
        grid = H.gridOf(f);
        if (!grid.list.length) continue;
      } else if (f.items && f.items.some(Boolean)) {
        const items = f.items.filter(Boolean);
        if (!f.overGrid || f.overGrid.list.length !== items.length || items.some(it => !f.overGrid.list.some(e => e.it === it))) {
          const g = I.grid(2, 2);
          for (const it of items) {
            it.rot = false;
            I.putGrow(g, it);
          }
          f.overGrid = g;
        }
        grid = f.overGrid;
      } else continue;
      grid.noPut = true;
      grid.overFurn = f;
      out.push({
        f,
        grid,
        where: "창고"
      });
    }
    return out;
  };
  H.syncOver = function(f) {
    if (f && f.overGrid && f.items) f.items = f.items.map(it => it && f.overGrid.list.some(e => e.it === it) ? it : null);
  };
  H.lastSold = null;
  H.sell = function(f) {
    const s = SX.game.save, cat = H.FURN[f.kind];
    if (f.builtin || cat.builtin) {
      SX.log("붙박이는 팔 수 없습니다 — 자리만 옮깁니다");
      SX.audio.play("denied");
      return false;
    }
    if (f.items && f.items.some(Boolean) || f.gridObj && f.gridObj.list.length || f.grid && f.grid.list && f.grid.list.length) {
      SX.log("안에 든 걸 먼저 빼 주십시오");
      SX.audio.play("denied");
      return false;
    }
    if (SX.prog && SX.prog.gKitOf && SX.prog.gKitOf(s.garden, f)) {
      SX.log("자동 급수기를 먼저 떼어 주십시오 — 텃밭 상자 [" + SX.label("interact") + "] 창에서 뗍니다(남은 물은 급수기에 그대로 남습니다)");
      SX.audio.play("denied");
      return false;
    }
    if (SX.top) SX.top.unload(f, s.home);
    if (SX.ride) SX.ride.drop(f);
    const k = s.home.furn.indexOf(f);
    if (k < 0) return false;
    s.home.furn.splice(k, 1);
    if (H.deco && H.deco.sel === f) H.deco.sel = null;
    const got = Math.round(cat.price / 2);
    s.money += got;
    H.lastSold = {
      f,
      got
    };
    SX.audio.play("buy");
    SX.log("팔았습니다: " + cat.name + " +" + SX.won(got) + " — 꾸미기 창에서 되돌릴 수 있습니다");
    SX.ui.renderDeco && SX.ui.renderDeco();
    SX.game.persist();
    return true;
  };
  H.unsell = function() {
    const e = H.lastSold, s = SX.game.save;
    if (!e) return false;
    if (s.money < e.got) {
      SX.audio.play("denied");
      SX.log("받은 돈을 이미 써서 되돌릴 수 없습니다");
      return false;
    }
    s.money -= e.got;
    e.f.placed = false;
    s.home.furn.push(e.f);
    H.lastSold = null;
    SX.audio.play("pickup");
    SX.log("되돌렸습니다: " + H.FURN[e.f.kind].name + " -" + SX.won(e.got) + " — 창고에 있습니다");
    SX.ui.renderDeco && SX.ui.renderDeco();
    SX.game.persist();
    return true;
  };
  H.solidRects = function(kind, rot) {
    const cat = H.FURN[kind], sz = SX.art.propDims(kind, rot | 0);
    if (!sz) return [];
    const h = cat && !cat.flat && !cat.wall ? SX.art.propHit(kind, rot | 0) : null;
    if (h && h.low && h.rects && h.rects.length && h.walk && h.walk.length) {
      const wy = Math.min(...h.walk.map(r => r.y0));
      return h.rects.filter(r => r.y1 > wy + 1e-6).map(r => ({
        x0: r.x0,
        x1: r.x1,
        y0: Math.max(r.y0, wy),
        y1: r.y1
      })).concat(h.walk);
    }
    return h && h.rects && h.rects.length ? h.rects.concat(h.walk || []) : [ {
      x0: 0,
      y0: 0,
      x1: sz.fw,
      y1: sz.fh
    } ];
  };
  H.solidCells = function(kind, x, y, rot) {
    const sz = SX.art.propDims(kind, rot | 0), E = 1e-6;
    if (!sz) return [];
    const rs = H.solidRects(kind, rot);
    const seen = new Set, out = [];
    for (const r of rs) for (let yy = Math.floor(y + r.y0 + E); yy <= Math.ceil(y + r.y1 - E) - 1; yy++) for (let xx = Math.floor(x + r.x0 + E); xx <= Math.ceil(x + r.x1 - E) - 1; xx++) {
      const k = xx + "," + yy;
      if (seen.has(k)) continue;
      seen.add(k);
      out.push([ xx, yy ]);
    }
    return out;
  };
  H.blockCells = function(F, kind, x, y, rot) {
    const sz = SX.art.propDims(kind, rot | 0), h = SX.art.hitAt(SX.art.propHit(kind, rot | 0), x, y), E = 1e-6;
    if (!sz || !h) return H.solidCells(kind, x, y, rot);
    const rs = h.walk && h.walk.length ? h.low || !F ? h.walk : SX.map.wallFill(F, h.walk, x, y, sz.fw) : h.rects;
    const seen = new Set, out = [];
    for (const r of rs) for (let yy = Math.floor(r.y0 + E); yy <= Math.ceil(r.y1 - E) - 1; yy++) for (let xx = Math.floor(r.x0 + E); xx <= Math.ceil(r.x1 - E) - 1; xx++) {
      const k = xx + "," + yy;
      if (seen.has(k)) continue;
      seen.add(k);
      out.push([ xx, yy ]);
    }
    return out;
  };
  H.canPlace = function(F, kind, x, y, self, rot) {
    const lv = SX.hub.level;
    if (!lv || lv.scene !== "home") return false;
    const cat = H.FURN[kind], sz = SX.art.propDims(kind, rot | 0);
    if (!cat || !sz) return false;
    const R = lv.interior, T = SX.map.T, E = 1e-6;
    if (x < R.x0 - 1 || y < R.y0 - 1 || x + sz.fw > R.x1 + 2 || y + sz.fh > R.y1 + 2) return false;
    const d = lv.door;
    const tx0 = Math.floor(x + E), tx1 = Math.ceil(x + sz.fw - E) - 1, ty0 = Math.floor(y + E), ty1 = Math.ceil(y + sz.fh - E) - 1;
    const cells = H.solidCells(kind, x, y, rot);
    for (const [xx, yy] of cells) {
      if (F.tile(xx, yy) !== T.FLOOR) return false;
      if (F.storyOff && F.storyOff(xx, yy) || F.keepAt && F.keepAt(xx, yy) && !(F.doorKeepAt && F.doorKeepAt(xx, yy)) && !cat.flat && !cat.wall) return false;
    }
    if (F.doorKeepAt && !cat.flat && !cat.wall && H.blockCells(F, kind, x, y, rot).some(([xx, yy]) => F.doorKeepAt(xx, yy))) return false;
    if (!cat.doorOk && SX.map.doorFrontHit(F, d, cells, H.solidRects(kind, rot), x, y)) return false;
    const over = (a, b) => a.x0 < b.x1 - E && b.x0 < a.x1 - E && a.y0 < b.y1 - E && b.y0 < a.y1 - E;
    const foot = {
      x0: x,
      y0: y,
      x1: x + sz.fw,
      y1: y + sz.fh
    };
    const floorOf = hh => hh.foot && hh.foot.length ? hh.foot : hh.walk && hh.walk.length ? hh.walk : null;
    const rectsOf = p => p.hit ? floorOf(p.hit) || p.hit.rects : [ {
      x0: p.x,
      y0: p.y,
      x1: p.x + p.w,
      y1: p.y + p.h
    } ];
    const h = !cat.flat && SX.art.hitAt(SX.art.propHit(kind, rot | 0), x, y);
    const mine = h ? floorOf(h) || h.rects : [ foot ];
    const wallish = hh => !!hh && !floorOf(hh);
    if (cat.wall) {
      if (y - Math.floor(y + E) > .25 + E) return false;
      for (let xx = tx0; xx <= tx1; xx++) {
        const t = F.tile(xx, ty0 - 1);
        if (t !== T.WALL && t !== T.WINDOW) return false;
      }
      return true;
    }
    for (const p of F.props) {
      if (p === self || p.kind === "loot" || p.ride) continue;
      if (cat.flat && p.flat) {
        if (over(foot, {
          x0: p.x,
          y0: p.y,
          x1: p.x + p.w,
          y1: p.y + p.h
        })) return false;
        continue;
      }
      if (!cat.flat && !p.flat) {
        if (wallish(p.hit) || p.furn && H.FURN[p.furn.kind] && H.FURN[p.furn.kind].wall) continue;
        const theirs = rectsOf(p);
        if (mine.some(a => theirs.some(b => over(a, b)))) return false;
      }
    }
    const pl = A.player;
    if (!cat.flat && pl && mine.some(q => pl.x > q.x0 - .25 && pl.x < q.x1 + .25 && pl.y > q.y0 - .25 && pl.y < q.y1 + .25)) return false;
    return true;
  };
  function addFurnProp(F, f) {
    if (SX.ride && SX.ride.isOn(f)) {
      SX.ride.sync(F, H.save());
      return F.props.find(q => q.ride && q.furn === f) || null;
    }
    const cat = H.FURN[f.kind];
    const p = SX.map.addProp(F, f.kind, f.x, f.y, {
      v: f.v | 0,
      rot: f.rot | 0,
      solid: !cat.flat && !cat.wall,
      tall: !!cat.tall,
      hit: cat.flat || cat.wall ? null : SX.art.propHit(f.kind, f.rot | 0),
      npc: cat.use ? {
        role: cat.use,
        name: cat.name,
        furn: f
      } : null
    });
    if (!p) return null;
    p.col = f.col || null;
    p.furn = f;
    p.items = f.items || null;
    p.flat = !!cat.flat;
    F.ver = (F.ver || 0) + 1;
    if (SX.ride && SX.ride.HOSTS[f.kind]) SX.ride.sync(F, H.save());
    SX.map.homeLights(F);
    return p;
  }
  function removeFurnProp(F, p) {
    if (SX.ride) SX.ride.lift(F, p);
    SX.map.removeProp(F, p);
    F.ver = (F.ver || 0) + 1;
    SX.map.homeLights(F);
  }
  H.putFurnProp = addFurnProp;
  H.dropFurnProp = removeFurnProp;
  const snap = () => {
    const h = H.save(), eff = {};
    for (const p of H.parts()) eff[p.key] = {
      wall: H.partWall(p),
      floor: H.partFloor(p)
    };
    return {
      wall: h.wall || null,
      floor: h.floor != null ? h.floor : null,
      rooms: copyRooms(h.rooms),
      eff,
      cols: new Map(h.furn.map(f => [ f.id, f.col || null ]))
    };
  };
  H.startDeco = function() {
    if (SX.hub.scene !== "home") {
      SX.log("꾸미기는 셸터에서만");
      return;
    }
    if (SX.homeUse) SX.homeUse.stop();
    H.deco = {
      sel: null,
      hover: null,
      orig: snap(),
      part: "all",
      roomTab: false
    };
    SX.ui.openDeco();
    SX.audio.play("click");
  };
  H.pending = function() {
    const d = H.deco;
    if (!d) return [];
    const h = H.save(), o = d.orig, out = [];
    for (const p of H.parts()) {
      const e = o.eff[p.key];
      if (!e) continue;
      if (H.partWall(p) !== e.wall) out.push({
        what: "벽지",
        part: p.key,
        where: p.name,
        price: p.n * H.PRICE.wall
      });
      if (H.partFloor(p) !== e.floor) out.push({
        what: "바닥",
        part: p.key,
        where: p.name,
        price: p.n * H.PRICE.floor
      });
    }
    for (const f of h.furn) if (o.cols.has(f.id) && (f.col || null) !== o.cols.get(f.id)) out.push({
      what: H.FURN[f.kind].name + " 색",
      price: H.PRICE.paint
    });
    return out;
  };
  H.pendingTotal = () => H.pending().reduce((s, q) => s + q.price, 0);
  H.pendingLines = function() {
    const pend = H.pending(), all = H.parts().length, out = [];
    for (const what of [ "벽지", "바닥" ]) {
      const L = pend.filter(q => q.what === what);
      if (!L.length) continue;
      if (all === 1) out.push({
        label: what,
        n: 1,
        price: L[0].price
      }); else if (L.length === all) out.push({
        label: what + " — 집 전체",
        n: 1,
        price: L.reduce((s, q) => s + q.price, 0)
      }); else for (const q of L) out.push({
        label: what + " — " + q.where,
        n: 1,
        price: q.price
      });
    }
    for (const q of pend) {
      if (q.part) continue;
      const e = out.find(x => x.label === q.what && x.paint);
      if (e) {
        e.n++;
        e.price += q.price;
      } else out.push({
        label: q.what,
        n: 1,
        price: q.price,
        paint: true
      });
    }
    return out;
  };
  H.commit = function() {
    const d = H.deco;
    if (!d) return false;
    const t = H.pendingTotal(), s = SX.game.save;
    if (!t) return true;
    if (s.money < t) {
      SX.audio.play("denied");
      SX.log("돈이 모자랍니다");
      return false;
    }
    s.money -= t;
    d.orig = snap();
    SX.audio.play("buy");
    SX.log("꾸미기 구매 — " + SX.won(t));
    SX.game.persist();
    SX.ui.renderDeco();
    return true;
  };
  H.revert = function() {
    const d = H.deco;
    if (!d) return;
    const h = H.save(), o = d.orig;
    const room = (h.wall || null) !== o.wall || (h.floor != null ? h.floor : null) !== o.floor || JSON.stringify(copyRooms(h.rooms)) !== JSON.stringify(o.rooms);
    h.wall = o.wall;
    h.floor = o.floor;
    h.rooms = copyRooms(o.rooms);
    for (const f of h.furn) if (o.cols.has(f.id)) f.col = o.cols.get(f.id);
    const F = SX.hub.floor();
    if (F) for (const p of F.props) if (p.furn) p.col = p.furn.col || null;
    if (room) SX.hub.rebuild(true); else if (F) SX.map.homeLights(F);
    SX.ui.renderDeco();
  };
  H.stopDeco = function(force, back) {
    const d = H.deco;
    if (!d) return;
    const t = H.pendingTotal();
    if (t && !force) {
      SX.ui.ask("구매 안 한 꾸미기가 있습니다", H.pendingLines().map(q => q.label + (q.n > 1 ? " ×" + q.n : "")).join(" · ") + "<br>구매하지 않으면 원래대로 돌아갑니다.", t, () => {
        if (H.commit()) H.stopDeco(true, back);
      }, () => {
        H.revert();
        H.stopDeco(true, back);
      }, {
        yes: "구매하고 끝내기",
        no: "버리고 끝내기"
      });
      return;
    }
    if (t) H.revert();
    if (d.sel) H.store(d.sel);
    if (d.hover) d.hover.hl = false;
    if (SX.top) SX.top.stop();
    H.deco = null;
    if (SX.hub && SX.hub.scene === "home" && SX.hub.level) H.fixLoose(SX.hub.floor());
    SX.ui.closeDeco();
    SX.game.persist();
    if (back && SX.ui.openMenu) SX.ui.openMenu();
  };
  H.select = function(f) {
    if (!H.deco) return;
    if (H.deco.sel && H.deco.sel !== f) H.store(H.deco.sel);
    H.deco.sel = f;
    f.placed = false;
    H.deco.held = null;
    H.deco.grab = null;
    SX.ui.renderDeco();
  };
  H.store = function(f) {
    f.placed = false;
    if (SX.ride) SX.ride.drop(f);
    if (SX.top && !H.inOtherLayout(f)) SX.top.unload(f, H.save());
    if (f.builtin) f.stored = 1;
    if (H.deco && H.deco.sel === f) H.deco.sel = null;
    SX.ui.renderDeco && SX.ui.renderDeco();
  };
  const wallBoxes = new Map;
  H.wallBox = function(kind, v, col, rot) {
    const cat = H.FURN[kind];
    if (!cat || !cat.wall) return null;
    const s = SX.art.prop(kind, v | 0, col, rot | 0);
    if (!s) return null;
    let b = wallBoxes.get(s.c);
    if (b === undefined) {
      const w = s.c.width, h = s.c.height, d = s.c.getContext("2d").getImageData(0, 0, w, h).data;
      let x0 = w, y0 = h, x1 = -1, y1 = -1;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 0) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
      const TS = SX.TS;
      b = x1 < 0 ? null : {
        x0: x0 / TS,
        y0: (y0 + s.oy) / TS,
        x1: (x1 + 1) / TS,
        y1: (y1 + 1 + s.oy) / TS
      };
      wallBoxes.set(s.c, b);
    }
    return b;
  };
  const grabOf = d => {
    if (d.grab) return d.grab;
    const c = d.sel && H.FURN[d.sel.kind];
    return {
      cx: 0,
      cy: -(.3 + (c && c.wall ? 1.1 : 0))
    };
  };
  const rawAt = (d, sz) => {
    const g = grabOf(d), V = SX.view;
    return {
      x: V.mouseWorldX - g.cx - sz.fw / 2,
      y: V.mouseWorldY - g.cy - sz.fh / 2
    };
  };
  H.mouseFor = function(x, y) {
    const d = H.deco;
    if (!d || !d.sel) return null;
    const sz = SX.art.propDims(d.sel.kind, d.sel.rot | 0), g = grabOf(d);
    return sz ? {
      x: x + g.cx + sz.fw / 2,
      y: y + g.cy + sz.fh / 2
    } : null;
  };
  H.ghost = function(o) {
    const d = H.deco;
    if (!d || !d.sel) return null;
    const rot = d.sel.rot | 0, sz = SX.art.propDims(d.sel.kind, rot);
    if (!sz) return null;
    const In = SX.input, whole = !(o && o.free) && (In.down.has("ShiftLeft") || In.down.has("ShiftRight")), st = whole ? 1 : ctrlDown() ? H.FINE : H.STEP;
    const cat = H.FURN[d.sel.kind], r = rawAt(d, sz), x = Math.round(r.x / st) * st, y = Math.round(r.y / st) * st;
    const F = SX.hub.floor();
    let gx = x, gy = y;
    if (!whole && cat && !cat.flat && !cat.wall) {
      const s = H.snapWall(F, d.sel.kind, x, y, rot, st > H.SNAP ? st - H.FINE : H.SNAP);
      gx = s.x;
      gy = s.y;
    }
    let hit = cat && !cat.flat && !cat.wall ? SX.art.propHit(d.sel.kind, rot) : null;
    if (hit && hit.walk && hit.walk.length && F && !hit.low) {
      const moved = hit.walk.map(q => ({
        x0: q.x0 + gx,
        x1: q.x1 + gx,
        y0: q.y0 + gy,
        y1: q.y1 + gy
      }));
      hit = Object.assign({}, hit, {
        walk: SX.map.wallFill(F, moved, gx, gy, sz.fw).map(q => ({
          x0: q.x0 - gx,
          x1: q.x1 - gx,
          y0: q.y0 - gy,
          y1: q.y1 - gy
        }))
      });
    }
    if (SX.ride && SX.ride.KINDS[d.sel.kind]) {
      const rd = SX.ride.target(F, d.sel, gx, gy);
      if (rd) return {
        kind: d.sel.kind,
        v: d.sel.v | 0,
        col: d.sel.col,
        rot,
        x: rd.x,
        y: rd.y,
        w: sz.fw,
        h: sz.fh,
        hit: null,
        ok: true,
        ride: {
          host: rd.host,
          s: rd.s
        }
      };
    }
    return {
      kind: d.sel.kind,
      v: d.sel.v | 0,
      col: d.sel.col,
      rot,
      x: gx,
      y: gy,
      w: sz.fw,
      h: sz.fh,
      hit,
      ok: H.canPlace(F, d.sel.kind, gx, gy, null, rot)
    };
  };
  H.snapWall = function(F, kind, x, y, rot, lim) {
    const h = SX.art.propHit(kind, rot | 0);
    if (!h || !h.rects || !h.rects.length) return {
      x,
      y
    };
    const T = SX.map.T, E = 1e-6, L = (lim == null ? H.SNAP : lim) + (h.low && h.walk && h.walk.length ? H.FINE : 0) + E, wall = (tx, ty) => {
      const t = F.tile(tx, ty);
      return t === T.WALL || t === T.WINDOW || t === T.VOID;
    };
    const rs = h.low && h.walk && h.walk.length ? H.solidRects(kind, rot) : h.rects;
    const bx0 = Math.min(...rs.map(r => r.x0)), bx1 = Math.max(...rs.map(r => r.x1)), by0 = Math.min(...rs.map(r => r.y0)), by1 = Math.max(...rs.map(r => r.y1));
    const rowsOf = yy => {
      const a = [];
      for (let r = Math.floor(yy + by0 + E); r <= Math.ceil(yy + by1 - E) - 1; r++) a.push(r);
      return a;
    };
    const colsOf = xx => {
      const a = [];
      for (let c = Math.floor(xx + bx0 + E); c <= Math.ceil(xx + bx1 - E) - 1; c++) a.push(c);
      return a;
    };
    let nx = x, ny = y;
    {
      const edge = y + by0, b = Math.ceil(edge - E), gap = b - edge;
      if (gap > E && gap <= L && colsOf(nx).every(c => wall(c, b - 1) && !wall(c, b)) && H.canPlace(F, kind, nx, y + gap, null, rot)) ny = y + gap;
    }
    {
      const edge = x + bx0, b = Math.ceil(edge - E), gap = b - edge;
      if (gap > E && gap <= L && rowsOf(ny).every(r => wall(b - 1, r) && !wall(b, r)) && H.canPlace(F, kind, x + gap, ny, null, rot)) nx = x + gap;
    }
    {
      const edge = x + bx1, b = Math.floor(edge + E), gap = edge - b;
      if (nx === x && gap > E && gap <= L && rowsOf(ny).every(r => wall(b, r) && !wall(b - 1, r)) && H.canPlace(F, kind, x - gap, ny, null, rot)) nx = x - gap;
    }
    return {
      x: nx,
      y: ny
    };
  };
  const ARROWS = [ [ "ArrowLeft", -1, 0 ], [ "ArrowRight", 1, 0 ], [ "ArrowUp", 0, -1 ], [ "ArrowDown", 0, 1 ] ];
  function arrowSteps(d, dt) {
    const In = SX.input, out = [];
    if (!d.rep) d.rep = {};
    for (const [c, dx, dy] of ARROWS) {
      if (In.hit.has(c)) {
        out.push([ dx, dy, true ]);
        d.rep[c] = .35;
      } else if (In.down.has(c) && d.rep[c] != null) {
        d.rep[c] -= dt || 0;
        let n = 0;
        while (d.rep[c] <= 0 && n < 3) {
          out.push([ dx, dy, false ]);
          d.rep[c] += .05;
          n++;
        }
        if (d.rep[c] <= 0) d.rep[c] = .05;
      } else delete d.rep[c];
    }
    return out;
  }
  const shiftDown = () => SX.input.down.has("ShiftLeft") || SX.input.down.has("ShiftRight");
  function ctrlDown() {
    return SX.input.down.has("ControlLeft") || SX.input.down.has("ControlRight");
  }
  const stepTo = (v, dir) => {
    if (shiftDown()) return v + dir;
    if (ctrlDown()) return v + dir * H.FINE;
    const n = v / H.STEP, E = 1e-6;
    return (dir > 0 ? Math.floor(n + E) + 1 : Math.ceil(n - E) - 1) * H.STEP;
  };
  H.nudge = function(dx, dy) {
    const d = H.deco;
    if (!d || !d.sel) return false;
    const g = H.ghost({
      free: true
    });
    if (!g) return false;
    const V = SX.view, sz = SX.art.propDims(d.sel.kind, d.sel.rot | 0), nx = dx ? stepTo(g.x, dx) : g.x, ny = dy ? stepTo(g.y, dy) : g.y;
    d.grab = {
      cx: V.mouseWorldX - nx - sz.fw / 2,
      cy: V.mouseWorldY - ny - sz.fh / 2
    };
    return true;
  };
  H.nudgePlaced = function(p, dx, dy, loud) {
    const F = SX.hub.floor(), f = p && p.furn;
    if (!F || !f) return null;
    if (p.ride) {
      if (loud) SX.audio.play("denied");
      return null;
    }
    const nx = dx ? stepTo(p.x, dx) : p.x, ny = dy ? stepTo(p.y, dy) : p.y;
    if (!H.canPlace(F, f.kind, nx, ny, p, f.rot | 0)) {
      if (loud) SX.audio.play("denied");
      return null;
    }
    removeFurnProp(F, p);
    f.x = nx;
    f.y = ny;
    const np = addFurnProp(F, f);
    if (H.deco) {
      H.deco.dirty = true;
      if (np) {
        np.hl = true;
        H.deco.hover = np;
      }
    }
    return np;
  };
  H.spinProp = function(F, p, rot, keep) {
    const f = p && p.furn ? H.live(p.furn) : null;
    if (!F || !f || F.props.indexOf(p) < 0) return null;
    const r0 = f.rot | 0;
    removeFurnProp(F, p);
    f.rot = ((rot | 0) % 4 + 4) % 4;
    let np = addFurnProp(F, f);
    if (keep) f.rot = r0;
    if (!np) {
      f.rot = r0;
      np = addFurnProp(F, f);
    }
    return np;
  };
  H.furnSnd = function(kind, lift) {
    const A = SX.audio, s = A && A.FURN_SND && A.FURN_SND[kind];
    if (!A) return;
    if (s) A.play(s, {
      lift: !!lift
    }); else A.play(lift ? "click" : "pickup");
  };
  H.rotate = function(dirn) {
    const d = H.deco;
    if (!d || !d.sel) return;
    if (SX.art.noRot && SX.art.noRot(d.sel.kind)) {
      SX.log((H.FURN[d.sel.kind] || {}).station ? "역 시설은 돌릴 수 없습니다" : "이 가구는 물건을 얹는 것이라 안 돌아갑니다");
      SX.audio.play("denied");
      return;
    }
    d.sel.rot = (((d.sel.rot | 0) + (dirn || 1)) % 4 + 4) % 4;
    SX.audio.play("click");
    SX.ui.renderDeco();
  };
  H.updateDeco = function(dt) {
    const d = H.deco;
    if (!d) return;
    if (SX.ui.asking && SX.ui.asking()) return;
    const In = SX.input, F = SX.hub.floor(), V = SX.view;
    if (d.hover) {
      d.hover.hl = false;
      d.hover = null;
    }
    if (SX.top && SX.top.update(dt)) return;
    const steps = arrowSteps(d, dt);
    if (d.dirty && !ARROWS.some(a => In.down.has(a[0]))) {
      d.dirty = false;
      SX.game.persist();
    }
    if (d.sel) {
      if (In.hit.has("KeyR") || In.hit.has("KeyQ")) H.rotate(In.hit.has("KeyQ") ? -1 : 1);
      if (In.wheel) H.rotate(In.wheel > 0 ? 1 : -1);
      for (const [dx, dy] of steps) H.nudge(dx, dy);
      const g = H.ghost();
      if (In.hit.has("Mouse0") && g) {
        if (g.ok) {
          if (SX.ride) SX.ride.setOn(d.sel, g.ride);
          d.sel.x = g.x;
          d.sel.y = g.y;
          d.sel.placed = true;
          delete d.sel.stored;
          addFurnProp(F, d.sel);
          H.furnSnd(d.sel.kind, false);
          d.sel = null;
          SX.ui.renderDeco();
          SX.game.persist();
        } else SX.audio.play("denied");
      }
      if (In.hit.has("Mouse2")) {
        H.store(d.sel);
        SX.audio.play("rustle");
      }
    } else {
      const mx = V.mouseWorldX, my = V.mouseWorldY + .3;
      let best = null;
      for (const p of F.props) {
        if (!p.furn || F.seeOff && F.seeOff(Math.floor(p.x + p.w / 2), Math.floor(p.y + p.h - .001))) continue;
        const wl = !!(H.FURN[p.furn.kind] || {}).wall;
        const wb = wl ? H.wallBox(p.furn.kind, p.v, p.col, p.rot) : null;
        const pk = !wl && !p.flat && SX.art.baseBox ? (SX.art.baseBox(p.furn.kind, p.rot) || {}).pick : null;
        if (wb ? mx >= p.x + wb.x0 && mx < p.x + wb.x1 && V.mouseWorldY >= p.y + wb.y0 && V.mouseWorldY < p.y + wb.y1 : pk ? mx >= p.x + pk.x0 && mx < p.x + pk.x1 && V.mouseWorldY >= p.y + pk.y0 && V.mouseWorldY < p.y + pk.y1 : mx >= p.x && mx < p.x + p.w && my >= p.y - (p.flat ? 0 : wl ? 1.7 : .6) && my < p.y + (wl ? .4 : p.h)) {
          if (!best || best.flat && !p.flat || wl && my < p.y || p.ride && !best.ride) best = p;
        }
      }
      if (best) {
        best.hl = true;
        d.hover = best;
      }
      if (best && steps.length && !In.hit.has("Mouse0")) {
        for (const [dx, dy, fresh] of steps) {
          const np = H.nudgePlaced(best, dx, dy, fresh);
          if (!np) break;
          best = np;
        }
      }
      if (In.hit.has("Mouse0") && best) {
        removeFurnProp(F, best);
        best.furn.placed = false;
        d.sel = best.furn;
        H.furnSnd(best.furn.kind, true);
        d.grab = {
          cx: V.mouseWorldX - (best.x + best.w / 2),
          cy: V.mouseWorldY - (best.y + best.h / 2)
        };
        SX.ui.renderDeco();
      } else if (In.hit.has("Mouse0") && d.roomTab) {
        const pt = H.partAt(Math.floor(mx), Math.floor(V.mouseWorldY));
        const ctrl = In.down.has("ControlLeft") || In.down.has("ControlRight");
        const nk = pt && H.parts().length > 1 ? ctrl ? H.partToggle(d.part, pt.key) : pt.key : null;
        if (nk && nk !== d.part) {
          d.part = nk;
          SX.audio.play("click");
          SX.ui.renderDeco();
        }
      }
    }
  };
  H.paint = function(f, col) {
    f.col = col;
    SX.audio.play("click");
    const F = SX.hub.floor(), p = F && F.props.find(q => q.furn === f);
    if (p) {
      p.col = col;
      SX.map.homeLights(F);
    }
    SX.ui.renderDeco();
  };
  const tidyRooms = h => {
    for (const k in h.rooms) {
      const o = h.rooms[k];
      if (!o || o.wall == null && o.floor == null) delete h.rooms[k];
    }
  };
  H.setWall = function(col, key) {
    const h = H.save(), parts = H.targetParts(key || H.deco && H.deco.part || "all"), whole = parts.length === H.parts().length;
    if (!parts.length || parts.every(p => H.partWall(p) === col)) return;
    if (!h.rooms || typeof h.rooms !== "object") h.rooms = {};
    if (whole) {
      for (const p of parts) if (h.rooms[p.key]) delete h.rooms[p.key].wall;
      h.wall = col;
    } else for (const p of parts) {
      const o = h.rooms[p.key] || (h.rooms[p.key] = {});
      delete o.wall;
      if (H.partWall(p) !== col) o.wall = col;
    }
    tidyRooms(h);
    SX.audio.play("click");
    SX.hub.rebuild(true);
    SX.ui.renderDeco();
  };
  H.setFloor = function(fs, key) {
    const h = H.save(), parts = H.targetParts(key || H.deco && H.deco.part || "all"), whole = parts.length === H.parts().length;
    if (!parts.length || parts.every(p => H.partFloor(p) === fs)) return;
    if (!h.rooms || typeof h.rooms !== "object") h.rooms = {};
    if (whole) h.floor = fs;
    for (const p of parts) {
      const o = h.rooms[p.key] || (h.rooms[p.key] = {});
      delete o.floor;
      if (H.partFloor(p) !== fs) o.floor = fs;
    }
    tidyRooms(h);
    SX.audio.play("click");
    SX.hub.rebuild(true);
    SX.ui.renderDeco();
  };
  H.slotsOf = function(f) {
    const d = SX.art.propDef(f.kind);
    if (!d) return 0;
    return (d.slots ? d.slots.length : 0) + (d.racks ? d.racks.length : 0);
  };
  H.displayItems = function(f) {
    f = H.live(f);
    if (!f.items) f.items = [];
    return f.items;
  };
  H.putDisplay = function(f, k, it) {
    f = H.live(f);
    const cat = H.FURN[f.kind];
    if (cat.use === "rack" && !(it.kind === "gun" || it.kind === "melee")) {
      SX.log("거치대엔 총·근접무기만");
      SX.audio.play("denied");
      return false;
    }
    const list = H.displayItems(f);
    if (list[k]) return false;
    list[k] = it;
    H.syncProp(f);
    return true;
  };
  H.takeDisplay = function(f, k) {
    f = H.live(f);
    const list = H.displayItems(f), it = list[k];
    list[k] = null;
    H.syncProp(f);
    return it;
  };
  H.syncProp = function(f) {
    f = H.live(f);
    const F = SX.hub.level && SX.hub.scene === "home" ? SX.hub.floor() : null;
    if (!F) return;
    const p = F.props.find(q => q.furn && (q.furn === f || q.furn.id === f.id));
    if (p) {
      p.furn = f;
      if (p.npc) p.npc.furn = f;
      p.items = f.items;
    }
  };
  H.dump = function(home) {
    const o = H.deco && H.deco.orig;
    const out = Object.assign({}, home, {
      furn: home.furn.map(f => Object.assign({}, f, {
        gridObj: undefined,
        items: f.items ? f.items.map(it => it ? I.dump(it) : null) : undefined,
        grid: f.gridObj ? I.gridDump(f.gridObj) : f.grid,
        overGrid: undefined,
        col: o && o.cols.has(f.id) ? o.cols.get(f.id) : f.col
      })),
      loose: H.looseDump(home)
    });
    out.rooms = copyRooms(home.rooms);
    if (o) {
      out.wall = o.wall;
      out.floor = o.floor;
      out.rooms = copyRooms(o.rooms);
    }
    return out;
  };
  H.migratePlan = function(h) {
    if (!h || !SX.map || !SX.map.homePlan) return h;
    const MV = {
      0: {
        w0: 5,
        h0: 4
      },
      1: {
        w0: 7,
        h0: 5
      },
      2: {
        w0: 9,
        h0: 6
      },
      4: {
        w0: 10,
        h0: 12
      },
      6: {
        w0: 28,
        h0: 13,
        dx: 11,
        dy: 10
      }
    };
    for (const k in MV) {
      const m = MV[k], P = SX.map.homePlan(H.TIERS[k]), dx = m.dx | 0, dy = m.dy | 0;
      const W0 = m.w0 + 2, N0 = W0 * (m.h0 + 2), W1 = P.w + 2, N1 = W1 * (P.h + 2), c = h.cells && h.cells[k];
      if (c && typeof c === "object") for (const q of [ "f", "w", "b" ]) {
        const s = c[q];
        if (typeof s !== "string" || s.length !== N0) continue;
        const a = new Array(N1).fill(".");
        for (let g = 0; g < N0; g++) {
          if (s[g] === ".") continue;
          const x = g % W0 - 1 + dx, y = Math.floor(g / W0) - 1 + dy;
          if (x < -1 || y < -1 || x > P.w || y > P.h) continue;
          a[(y + 1) * W1 + (x + 1)] = s[g];
        }
        c[q] = a.join("");
      }
      if (!dx && !dy) continue;
      const mv = e => {
        if (e && typeof e.x === "number" && typeof e.y === "number") {
          e.x += dx;
          e.y += dy;
        }
      };
      if ((h.tier | 0) === (k | 0)) {
        for (const f of h.furn || []) if (f && f.placed) mv(f);
        for (const l of h.loose || []) mv(l);
      }
      const L = h.layouts && h.layouts[k];
      if (L && Array.isArray(L.placed)) for (const e of L.placed) mv(e);
    }
    return h;
  };
  H.clearNewDoors = function(h) {
    if (!h || !SX.map || !SX.map.HOME_MG || !SX.art) return 0;
    const o = SX.map.HOME_MG + 1, block = new Set;
    for (const [x, y] of [ [ 20, 9 ], [ 28, 9 ], [ 35, 13 ] ]) for (let i = 0; i < 2; i++) for (const dy of [ -1, 1 ]) block.add(x + i + o + "," + (y + dy + o));
    const hit = (kind, x, y, rot) => {
      const c = H.FURN[kind];
      if (!c || c.flat || c.wall || typeof x !== "number" || typeof y !== "number") return false;
      return H.solidCells(kind, x, y, rot | 0).some(([a, b]) => block.has(a + "," + b));
    };
    const riding = (f, e) => e ? !!e.on : !!(SX.ride && SX.ride.isOn(f));
    let n = 0;
    if ((h.tier | 0) === 6) for (const f of h.furn || []) if (f && f.placed && !riding(f) && hit(f.kind, f.x, f.y, f.rot)) {
      f.placed = false;
      n++;
    }
    const L = h.layouts && h.layouts[6];
    if (L && Array.isArray(L.placed)) L.placed = L.placed.filter(e => {
      const f = e && (h.furn || []).find(q => q.id === e.id);
      if (!f || riding(f, e) || !hit(f.kind, e.x, e.y, e.rot)) return true;
      n++;
      return false;
    });
    return n;
  };
  H.clearShopDoor = function(h) {
    if (!h || !SX.map || !SX.map.homePlan || !SX.map.HOME_MG || !SX.map.doorFront || !SX.art) return 0;
    const e = SX.map.homePlan(H.TIERS[5]).entry;
    if (!e || e.side !== "r") return 0;
    const o = SX.map.HOME_MG + 1, d = {
      x: o + e.x,
      y: o + e.y,
      horiz: false,
      len: 2
    };
    const hit = (kind, x, y, rot) => {
      const c = H.FURN[kind];
      if (!c || c.flat || c.wall || typeof x !== "number" || typeof y !== "number") return false;
      return H.solidCells(kind, x, y, rot | 0).some(([a, b]) => SX.map.doorFront(d, a, b));
    };
    const riding = (f, en) => en ? !!en.on : !!(SX.ride && SX.ride.isOn(f));
    let n = 0;
    if ((h.tier | 0) === 5) for (const f of h.furn || []) if (f && f.placed && !riding(f) && hit(f.kind, f.x, f.y, f.rot)) {
      f.placed = false;
      n++;
    }
    const L = h.layouts && h.layouts[5];
    if (L && Array.isArray(L.placed)) L.placed = L.placed.filter(en => {
      const f = en && (h.furn || []).find(q => q.id === en.id);
      if (!f || riding(f, en) || !hit(f.kind, en.x, en.y, en.rot)) return true;
      n++;
      return false;
    });
    return n;
  };
  H.migrateDuplex = function(h, from) {
    if (!h || !SX.map || !SX.map.homePlan || !SX.map.HOME_MG) return h;
    const r1 = from === 1, P = SX.map.homePlan(H.TIERS[3]), o = SX.map.HOME_MG + 1, DX = r1 ? -12 : 0, W0 = r1 ? 23 : 11, N0 = W0 * 12, W1 = P.w + 2, N1 = W1 * (P.h + 2), c = h.cells && h.cells[3];
    const isUp = (x, y) => y <= 2 && (!r1 || x >= 11);
    if (c && typeof c === "object") for (const q of [ "f", "w", "b" ]) {
      const s = c[q];
      if (typeof s !== "string" || s.length !== N0) continue;
      const a = new Array(N1).fill(".");
      for (let g = 0; g < N0; g++) {
        if (s[g] === ".") continue;
        const y = Math.floor(g / W0) - 1, x0 = g % W0 - 1, x = x0 + (isUp(x0, y) ? DX : 0);
        if (x < -1 || y < -1 || x > P.w || y > P.h) continue;
        a[(y + 1) * W1 + (x + 1)] = s[g];
      }
      c[q] = a.join("");
    }
    const mv = e => {
      if (e && typeof e.x === "number" && typeof e.y === "number" && e.y < o + 3 && isUp(e.x - o, e.y - o)) e.x += DX;
    };
    if ((h.tier | 0) === 3) {
      for (const f of h.furn || []) if (f && f.placed) mv(f);
      for (const l of h.loose || []) mv(l);
    }
    const L = h.layouts && h.layouts[3];
    if (L && Array.isArray(L.placed)) for (const e of L.placed) mv(e);
    const block = new Set, keep = new Set;
    for (const s of P.stairs || []) {
      for (let y = s.y0; y <= s.y1; y++) for (let x = s.x0; x <= s.x1; x++) block.add(x + o + "," + (y + o));
      if (s.dir === "up") for (let x = s.x0; x <= s.x1; x++) keep.add(x + o + "," + (s.y1 + 1 + o)); else if (s.dir) keep.add(s.x0 - 1 + o + "," + (s.y0 + o));
    }
    const hit = (kind, x, y, rot) => {
      const cf = H.FURN[kind];
      if (!cf || typeof x !== "number" || typeof y !== "number") return false;
      return H.solidCells(kind, x, y, rot | 0).some(([a, b]) => block.has(a + "," + b) || !cf.flat && !cf.wall && keep.has(a + "," + b));
    };
    const riding = (f, e) => e ? !!e.on : !!(SX.ride && SX.ride.isOn(f));
    if ((h.tier | 0) === 3) for (const f of h.furn || []) if (f && f.placed && !riding(f) && hit(f.kind, f.x, f.y, f.rot)) f.placed = false;
    if (L && Array.isArray(L.placed)) L.placed = L.placed.filter(e => {
      const f = e && (h.furn || []).find(q => q.id === e.id);
      return !f || riding(f, e) || !hit(f.kind, e.x, e.y, e.rot);
    });
    return h;
  };
  H.restore = function(o) {
    const h = Object.assign(H.newHome(), o || {});
    if (o && !((o.hv | 0) >= 2)) h.hv = 0;
    H.migrateHome(h);
    if (o && (o.plv | 0) < 2) H.migratePlan(h);
    h.plv = 2;
    if (o && (o.dpx | 0) < 2) H.migrateDuplex(h, o.dpx | 0);
    if (SX.map && SX.map.homePlan) h.dpx = 2;
    h.rooms = copyRooms(h.rooms);
    if (h.layouts && typeof h.layouts === "object") for (const k in h.layouts) if (h.layouts[k] && typeof h.layouts[k] === "object") h.layouts[k].rooms = copyRooms(h.layouts[k].rooms);
    h.furn = (h.furn || []).map(f => {
      const g = Object.assign({}, f);
      if (f.items) g.items = f.items.map(d => d ? I.restore(d) : null);
      const c = H.FURN[g.kind];
      if (c && c.grid && g.grid && typeof g.grid === "object" && ((g.grid.cols | 0) < c.grid[0] || (g.grid.rows | 0) < c.grid[1])) g.grid = Object.assign({}, g.grid, {
        cols: Math.max(g.grid.cols | 0, c.grid[0]),
        rows: Math.max(g.grid.rows | 0, c.grid[1])
      });
      return g;
    });
    h.loose = (h.loose || []).map(l => ({
      x: l.x == null ? null : l.x | 0,
      y: l.y == null ? null : l.y | 0,
      items: (l.items || []).map(d => d ? I.restore(d) : null).filter(Boolean)
    })).filter(l => l.items.length);
    if (o && !o.nd) H.clearNewDoors(h);
    h.nd = 1;
    if (o && !o.ex5) H.clearShopDoor(h);
    if (SX.map && SX.map.homePlan) h.ex5 = 1;
    H.pruneLayouts(h);
    if (SX.top) SX.top.tidy(h, H.deco && H.deco.sel);
    if (SX.ride) SX.ride.tidy(h, H.deco && H.deco.sel);
    return h;
  };
  H.looseItems = l => l.cont ? l.cont.grid.list.map(e => e.it) : l.items || [];
  H.looseDump = home => (home.loose || []).map(l => ({
    x: l.x,
    y: l.y,
    items: H.looseItems(l).map(it => I.dump(it))
  })).filter(l => l.items.length);
  H.placeLoose = function(F, l) {
    const items = H.looseItems(l);
    if (!items.length) return null;
    if (l.x == null || !F.in(l.x, l.y) || !F.inside[F.i(l.x, l.y)] || F.fixAt && F.fixAt(l.x, l.y)) {
      const hd = (F.doors || []).find(d => d.home), vd = !!(hd && !hd.horiz);
      l.x = Math.floor(F.spawn.x) - (vd ? 1 : 0);
      l.y = Math.floor(F.spawn.y) - (vd ? 0 : 1);
    }
    const cont = SX.map.mkCont("loose", items);
    cont.searched = true;
    cont.revealed = items.length;
    cont.name = "바닥에 둔 것";
    cont.home = true;
    l.cont = cont;
    l.items = null;
    return SX.map.addProp(F, "loot", l.x, l.y, {
      cont,
      solid: false
    });
  };
  H.dropLoose = function(it) {
    const s = H.save();
    if (!s.loose) s.loose = [];
    const F = SX.game.state === "hub" && SX.hub.scene === "home" && SX.hub.level ? SX.hub.floor() : null, p = SX.actors.player;
    let l = null;
    if (F && p) {
      let tx = Math.floor(p.x), ty = Math.floor(p.y);
      const ok = (x, y) => F.in(x, y) && F.inside[F.i(x, y)] && F.tile(x, y) === SX.map.T.FLOOR;
      if (!ok(tx, ty)) {
        let best = null, bd = 1e9;
        for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
          const x = tx + dx, y = ty + dy;
          if (!ok(x, y)) continue;
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
      l = s.loose.find(q => q.cont && q.x === tx && q.y === ty);
      if (l) I.putGrow(l.cont.grid, it); else {
        l = {
          x: tx,
          y: ty,
          items: [ it ]
        };
        s.loose.push(l);
        H.placeLoose(F, l);
      }
      H.fixLoose(F);
      SX.log("바닥에 뒀습니다: " + it.name + " — [" + SX.label("interact") + "] 로 다시 주울 수 있습니다");
    } else {
      s.loose.push({
        x: null,
        y: null,
        items: [ it ]
      });
      SX.log("셸터 바닥에 두고 왔습니다: " + it.name);
    }
    SX.game.persist();
  };
  const hubPick = function(F, pr) {
    const p = SX.actors.player, Hb = SX.hub;
    if (!p || !Hb || Hb.floor() !== F) return true;
    const sv = [ p.x, p.y, p.aim ];
    let ok = false;
    for (const [dx, dy] of [ [ 0, 0 ], [ .5, 0 ], [ -.5, 0 ], [ 0, .5 ], [ 0, -.5 ], [ 1, 0 ], [ -1, 0 ], [ 0, 1 ], [ 0, -1 ], [ 1, 1 ], [ -1, -1 ], [ 1, -1 ], [ -1, 1 ] ]) {
      if (ok) break;
      const x = pr.x + .5 + dx, y = pr.y + .5 + dy;
      if (!SX.actors.free(F, x, y, .3)) continue;
      p.x = x;
      p.y = y;
      for (let a = 0; a < 16; a++) {
        p.aim = a * Math.PI / 8;
        const t = Hb.target();
        if (t && t.kind === "cont" && t.prop === pr) {
          ok = true;
          break;
        }
      }
    }
    p.x = sv[0];
    p.y = sv[1];
    p.aim = sv[2];
    return ok;
  };
  H.fixLoose = function(F) {
    const s = H.save();
    if (!F || !s.loose || !s.loose.length || H.deco) return;
    const piles = F.props.filter(q => q.cont && q.cont.home && q.cont.grid.list.length), entry = pr => s.loose.find(l => l.cont === pr.cont);
    const covered = (x, y, self) => F.props.some(q => q !== self && !q.flat && !(q.cont && q.cont.home) && x + .5 >= q.x && x + .5 < q.x + q.w && y + .5 >= q.y && y + .5 < q.y + q.h);
    const tileOk = (x, y) => F.in(x, y) && F.inside[F.i(x, y)] && F.tile(x, y) === SX.map.T.FLOOR && SX.actors.free(F, x + .5, y + .5, .3);
    let changed = false;
    const taken = new Map;
    for (const pr of piles) {
      const l = entry(pr);
      if (!l) continue;
      const k0 = pr.x + "," + pr.y, other = taken.get(k0);
      if (other) {
        for (const e of pr.cont.grid.list.slice()) {
          I.take(pr.cont.grid, e.it);
          I.putGrow(other.cont.grid, e.it);
        }
        SX.map.removeProp(F, pr);
        s.loose = s.loose.filter(q => q !== l);
        changed = true;
        continue;
      }
      const good = (x, y) => {
        if (!tileOk(x, y) || covered(x, y, pr) || taken.has(x + "," + y)) return false;
        const ox = pr.x, oy = pr.y;
        pr.x = x;
        pr.y = y;
        const ok = hubPick(F, pr);
        pr.x = ox;
        pr.y = oy;
        return ok;
      };
      if (!good(pr.x, pr.y)) {
        const cand = [];
        for (let y = 0; y < F.H; y++) for (let x = 0; x < F.W; x++) if (tileOk(x, y)) cand.push([ x, y, Math.hypot(x - pr.x, y - pr.y) ]);
        cand.sort((a, b) => a[2] - b[2]);
        for (const [x, y] of cand) if (good(x, y)) {
          pr.x = x;
          pr.y = y;
          l.x = x;
          l.y = y;
          changed = true;
          break;
        }
      }
      taken.set(pr.x + "," + pr.y, pr);
    }
    if (changed) SX.game.persist();
  };
  H.sweepLoose = function(F) {
    const s = H.save();
    if (!s.loose || !s.loose.length) return;
    for (const pr of F.props) if (pr.cont && pr.cont.home && !pr.cont.grid.list.length) {
      SX.map.removeProp(F, pr);
      break;
    }
    s.loose = s.loose.filter(l => H.looseItems(l).length);
  };
  H.live = function(f) {
    if (!f || f.id == null || !SX.game.save || !SX.game.save.home) return f;
    if (SX.hub && SX.hub.scene === "visit") return f;
    const L = SX.game.save.home.furn;
    if (L.includes(f)) return f;
    return L.find(q => q.id === f.id && q.kind === f.kind) || f;
  };
  H.isLive = f => !!(f && SX.game.save && SX.game.save.home && SX.game.save.home.furn.includes(f));
  H.gridOf = function(f) {
    f = H.live(f);
    if (!f.gridObj) {
      const cat = H.FURN[f.kind];
      f.gridObj = f.grid ? I.gridFrom(f.grid) : I.grid(cat.grid[0], cat.grid[1]);
      f.gridObj.furnId = f.id;
      if (cat.grid) {
        f.gridObj.cols = Math.max(f.gridObj.cols, cat.grid[0]);
        f.gridObj.rows = Math.max(f.gridObj.rows, cat.grid[1]);
      }
      if (cat.food) {
        f.gridObj.accept = H.foodOnly;
        f.gridObj.acceptMsg = "냉장고엔 먹을 것 · 마실 것만 넣습니다";
      } else if (cat.water) {
        f.gridObj.accept = H.waterOnly;
        f.gridObj.acceptMsg = cat.name + "엔 생수병만 넣습니다";
      }
    }
    return f.gridObj;
  };
  H.foodOnly = it => !!(it && SX.needs && SX.needs.of(it));
  H.waterOnly = it => !!(it && it.name === "생수병");
  H.WATER = {
    SIPS: 3,
    DRINK: 25
  };
  H.waterOf = f => {
    f = H.live(f);
    return {
      wb: Math.max(0, f.wb | 0),
      sip: Math.max(0, f.sip | 0),
      cap: H.FURN[f.kind] && H.FURN[f.kind].cap || 4
    };
  };
  H.waterLeft = f => {
    const w = H.waterOf(f);
    return w.sip + w.wb * H.WATER.SIPS;
  };
  H.waterLabel = function(f) {
    const w = H.waterOf(f), left = H.waterLeft(f);
    return left ? "생수병 " + w.wb + "통 · 남은 " + left + "잔" : "비었습니다 — 생수병을 넣어 주십시오";
  };
  H.waterPut = function(f, take) {
    f = H.live(f);
    const w = H.waterOf(f);
    if (w.wb >= w.cap) return {
      ok: false,
      msg: "정수기가 가득 찼습니다 — 생수병 " + w.cap + "통까지"
    };
    if (!take("생수병")) return {
      ok: false,
      msg: "생수병이 없습니다 — 밥집에서 사거나 판에서 찾으시면 됩니다"
    };
    f.wb = w.wb + 1;
    return {
      ok: true,
      msg: "💧 생수병을 정수기에 넣었습니다 — " + H.waterLabel(f)
    };
  };
  H.waterDrink = function(f, save) {
    f = H.live(f);
    const w = H.waterOf(f), N = SX.needs, ns = N ? N.get(save) : null;
    if (!H.waterLeft(f)) return {
      ok: false,
      msg: "정수기가 비었습니다 — 생수병을 넣어 주십시오"
    };
    if (ns && ns.water >= 99.5) return {
      ok: false,
      msg: "목이 마르지 않습니다 — 지금은 안 마셔도 됩니다"
    };
    if (!w.sip) {
      f.wb = w.wb - 1;
      f.sip = H.WATER.SIPS;
    }
    f.sip = (f.sip | 0) - 1;
    if (ns) {
      ns.water = Math.min(100, ns.water + H.WATER.DRINK);
    }
    return {
      ok: true,
      msg: "💧 정수기 물을 마셨습니다 — " + H.waterLabel(f)
    };
  };
  H.valueInside = function() {
    let v = 0;
    for (const f of H.save().furn) {
      if (f.items) for (const it of f.items) if (it) v += it.val || 0;
    }
    return v;
  };
  let warmCv = null;
  H.warmArt = function() {
    if (H._warmOn) return;
    const ART = SX.art, F = SX.hub && SX.hub.scene === "home" && SX.hub.level ? SX.hub.floor() : null;
    const list = F ? F.props.filter(p => p.furn) : (SX.game.save && SX.game.save.home && SX.game.save.home.furn || []).filter(f => f.placed && H.FURN[f.kind]).map(f => ({
      kind: f.kind,
      v: f.v | 0,
      col: f.col || null,
      rot: f.rot | 0,
      hit: !H.FURN[f.kind].flat && !H.FURN[f.kind].wall
    }));
    if (!list.length) return;
    const ric = typeof requestIdleCallback === "function" ? requestIdleCallback : fn => setTimeout(() => fn({
      didTimeout: true,
      timeRemaining: () => 0
    }), 80);
    let i = 0;
    H._warmOn = true;
    const one = p => {
      if (p.hit === true) ART.propHit(p.kind, p.rot);
      const s = ART.prop(p.kind, p.v, p.col, p.rot);
      ART.propBase(p.kind, p.v, p.col, p.rot);
      ART.propOver(p.kind, p.v, p.col, p.rot);
      if (!s || !p.furn) return;
      if (!warmCv) warmCv = ART.mk(192, 256);
      const g = warmCv.getContext("2d"), now = performance.now() / 1e3;
      if (SX.homeUse && SX.homeUse.drawOn) SX.homeUse.drawOn(g, p, s, 32, 96, now);
      if (SX.top && SX.top.drawOn) SX.top.drawOn(g, p, 32, 96, now);
    };
    const go = dl => {
      if (SX.game.state !== "title") {
        H._warmOn = false;
        return;
      }
      const t0 = performance.now(), bud = dl.didTimeout ? 8 : Math.max(0, dl.timeRemaining() - 2);
      do {
        try {
          one(list[i]);
        } catch (e) {}
        i++;
      } while (i < list.length && performance.now() - t0 < bud);
      H.warmN = i;
      if (i < list.length) ric(go, {
        timeout: 200
      }); else H._warmOn = false;
    };
    ric(go, {
      timeout: 200
    });
  };
})(window.SX);
