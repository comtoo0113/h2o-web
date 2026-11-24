"use strict";

(function(SX) {
  const D = SX.data;
  const L = o => Object.assign({
    hairStyle: "short",
    hair: "#1e1812",
    skin: "#d8ac84",
    boot: "#2a2622"
  }, o);
  D.mercs = [ {
    id: "rookie",
    name: "신참 민수",
    price: 9e4,
    acc: .36,
    fov: 120,
    sight: 15,
    ear: 6,
    hp: 90,
    gun: "K5 권총",
    melee: "식칼",
    rate: 1.25,
    tag: "짐이나 들라고 데려갑니다",
    desc: "총 잡은 지 두 달. 싸긴 한데 한 발 맞으면 주저앉습니다.",
    look: L({
      topStyle: "hoodie",
      top: "#6a6458",
      pants: "#3a3f4a",
      pack: "#5a4a38",
      hat: "cap",
      hatCol: "#4a4a44"
    })
  }, {
    id: "guard",
    name: "경비 출신 태호",
    price: 19e4,
    acc: .55,
    fov: 150,
    sight: 22,
    ear: 12,
    hp: 155,
    gun: "USAS-12 산탄총",
    melee: "야구방망이",
    rate: 1.15,
    tag: "좁은 데서 앞장",
    desc: "복도에서 강합니다. 멀리는 못 맞히지만 문을 열고 먼저 들어갑니다.",
    look: L({
      topStyle: "uniform",
      top: "#2a3040",
      pants: "#242a36",
      vest: "#2a2a30",
      hat: "cap",
      hatCol: "#1e2436"
    })
  }, {
    id: "brawler",
    name: "소방도끼 창식",
    price: 14e4,
    acc: .2,
    fov: 130,
    sight: 16,
    ear: 14,
    hp: 230,
    gun: null,
    melee: "소방도끼",
    rate: 1,
    tag: "총 안 씁니다 · 몸으로 막습니다",
    desc: "총은 안 듭니다. 도끼 들고 달려드는 게 빠르다고 믿습니다. 대신 웬만해서는 의식을 잃지 않습니다.",
    look: L({
      hairStyle: "buzz",
      topStyle: "tee",
      top: "#7a3a30",
      pants: "#33372e",
      beard: true,
      gloves: "#3a3028"
    })
  }, {
    id: "porter",
    name: "짐꾼 두식",
    price: 16e4,
    acc: .3,
    fov: 110,
    sight: 14,
    ear: 8,
    hp: 130,
    gun: "K1A 기관단총",
    melee: "장도리",
    rate: 1.3,
    loot: 1.12,
    tag: "전리품을 더 챙겨 나옵니다",
    desc: "싸움은 못하지만 손이 빠릅니다. 같이 탈출하면 챙겨 나온 값이 늘어납니다.",
    look: L({
      topStyle: "jacket",
      top: "#5a4a2e",
      pants: "#3e3a30",
      pack: "#7a6a44",
      hat: "cap",
      hatCol: "#4a3e2a"
    })
  }, {
    id: "medic",
    name: "위생병 세연",
    price: 26e4,
    acc: .42,
    fov: 130,
    sight: 18,
    ear: 10,
    hp: 120,
    gun: "K5 권총",
    melee: "식칼",
    rate: 1.2,
    heal: 1.1,
    tag: "옆에 있으면 피가 찹니다",
    desc: "가까이 있으면 알아서 지혈해 줍니다. 총은 거들 뿐.",
    look: L({
      hairStyle: "bob",
      hair: "#2a1e18",
      topStyle: "coat",
      top: "#d8d8d0",
      pants: "#3a3f4a",
      pack: "#b83a34"
    })
  }, {
    id: "sniper",
    name: "저격수 윤",
    price: 32e4,
    acc: .76,
    fov: 95,
    sight: 36,
    ear: 8,
    hp: 110,
    gun: "K14 저격소총",
    melee: "식칼",
    rate: 1.6,
    tag: "멀리서 한 발씩",
    desc: "먼 데 있는 놈을 놓치지 않습니다. 대신 코앞은 서툽니다.",
    look: L({
      hairStyle: "long",
      topStyle: "camo",
      top: "#4a5238",
      pants: "#3f4630",
      hat: "boonie",
      hatCol: "#48503a",
      mask: true
    })
  }, {
    id: "quiet",
    name: "발소리 지훈",
    price: 3e5,
    acc: .6,
    fov: 140,
    sight: 20,
    ear: 18,
    hp: 125,
    gun: "K7 소음기관단총",
    melee: "식칼",
    rate: .9,
    tag: "조용히 정리합니다",
    desc: "소음기를 물린 총만 씁니다. 한 방에서 치우고 나오면 옆방은 모릅니다.",
    look: L({
      topStyle: "jacket",
      top: "#2e3238",
      pants: "#26282c",
      vest: "#22262a",
      hat: "hood",
      hatCol: "#2a2e34",
      mask: true
    })
  }, {
    id: "gunner",
    name: "기관총 병철",
    price: 42e4,
    acc: .52,
    fov: 160,
    sight: 24,
    ear: 14,
    hp: 200,
    gun: "K3 기관총",
    melee: "소방도끼",
    rate: .75,
    tag: "쏟아붓습니다",
    desc: "맞히는 건 그럭저럭인데 양으로 밉니다. 시끄럽습니다.",
    look: L({
      hairStyle: "buzz",
      topStyle: "camo",
      top: "#54503a",
      pants: "#44422e",
      vest: "#3a4228",
      gloves: "#2e2a22"
    })
  }, {
    id: "scout",
    name: "정찰병 해나",
    price: 28e4,
    acc: .5,
    fov: 200,
    sight: 30,
    ear: 22,
    hp: 115,
    gun: "K1A 기관단총",
    melee: "식칼",
    rate: 1.05,
    tag: "먼저 보고 먼저 알립니다",
    desc: "눈과 귀가 밝습니다. 뒤에서 오는 놈을 제일 먼저 봅니다.",
    look: L({
      hairStyle: "long",
      hair: "#3a2a1e",
      topStyle: "jacket",
      top: "#3a5a4a",
      pants: "#333a34",
      pack: "#4a5a48",
      hat: "cap",
      hatCol: "#2e4438"
    })
  }, {
    id: "vet",
    name: "베테랑 강",
    price: 52e4,
    acc: .82,
    fov: 175,
    sight: 28,
    ear: 20,
    hp: 215,
    gun: "K2 소총",
    melee: "캠핑도끼",
    rate: .95,
    tag: "다 됩니다",
    desc: "소리만 듣고 방향을 잡습니다. 비싼 값을 합니다.",
    look: L({
      hairStyle: "buzz",
      hair: "#2a2622",
      skin: "#c79871",
      topStyle: "camo",
      top: "#4f5a38",
      pants: "#3f4630",
      vest: "#3a4228",
      hat: "helmet",
      hatCol: "#3f4a30",
      beard: true
    })
  } ];
  SX.MERCS = D.mercs;
})(window.SX);
