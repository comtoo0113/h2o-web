"use strict";

(function(SX) {
  const D = SX.data;
  SX.FISH = [ {
    name: "피라미",
    val: 1500,
    w: 30,
    pull: .22,
    kg: [ .03, .09 ],
    col: [ "#8aa0b4", "#d8e4ec" ],
    desc: "손가락만 한 은빛 물고기. 한강 어디에나 있습니다."
  }, {
    name: "블루길",
    val: 3e3,
    w: 16,
    pull: .35,
    kg: [ .12, .35 ],
    col: [ "#4a6a4a", "#c8c070" ],
    desc: "외래종. 납작하고 아가미 뒤에 파란 점이 있습니다."
  }, {
    name: "붕어",
    val: 5e3,
    w: 28,
    pull: .45,
    kg: [ .25, .9 ],
    col: [ "#8a7a3a", "#d8c890" ],
    desc: "한강 낚시의 기본. 구우면 살이 제법 많습니다."
  }, {
    name: "배스",
    val: 9e3,
    w: 10,
    pull: .6,
    kg: [ .6, 2.2 ],
    col: [ "#4a5a3a", "#b8c090" ],
    desc: "입이 큰 외래종. 걸리면 힘차게 당깁니다."
  }, {
    name: "누치",
    val: 11e3,
    w: 5,
    pull: .55,
    kg: [ .5, 1.8 ],
    col: [ "#6a7a8a", "#d0d8d8" ],
    desc: "여울에 사는 길쭉한 물고기. 비늘이 큽니다."
  }, {
    name: "잉어",
    val: 15e3,
    w: 8,
    pull: .75,
    kg: [ 1.2, 4.5 ],
    col: [ "#a06a3a", "#e0b878" ],
    desc: "크고 무겁습니다. 줄이 자주 끊깁니다."
  }, {
    name: "메기",
    val: 24e3,
    w: 2.5,
    pull: .85,
    kg: [ 1.5, 5 ],
    col: [ "#3a3a44", "#9a9a8a" ],
    desc: "수염 달린 밤낚시의 큰손. 천천히, 끈질기게 버팁니다."
  }, {
    name: "장어",
    val: 3e4,
    w: 1,
    pull: .7,
    kg: [ .4, 1.3 ],
    col: [ "#3a4a3a", "#b0a870" ],
    desc: "미끈한 민물장어. 장터에서 귀하게 칩니다."
  }, {
    name: "쏘가리",
    val: 38e3,
    w: 1.5,
    pull: .8,
    kg: [ .6, 1.9 ],
    col: [ "#9a7a4a", "#f0d898" ],
    desc: "황갈색 얼룩무늬. 한강 낚시꾼이 꿈꾸는 한 마리입니다."
  } ];
  SX.FISH_JUNK = [ {
    name: "낡은 장화",
    val: 300,
    w: 1,
    h: 1,
    kg: .8,
    desc: "강바닥에서 건진 장화 한 짝. 짝이 없습니다."
  }, {
    name: "빈 깡통",
    val: 100,
    w: 1,
    h: 1,
    kg: .1,
    desc: "녹슨 깡통. 낚싯바늘이 잘 걸립니다."
  }, {
    name: "물먹은 나뭇가지",
    val: 50,
    w: 1,
    h: 1,
    kg: .4,
    desc: "강에 떠내려온 나뭇가지. 땔감도 못 됩니다."
  } ];
  SX.FISH_JUNK_P = .12;
  SX.FISH_MAX_VAL = 4e4;
  SX.ROD = {
    name: "낚싯대",
    kind: "rod",
    w: 1,
    h: 3,
    val: 5e4,
    price: 12e4,
    uses: 50,
    kg: .9,
    noRaid: true,
    wt: 0,
    desc: "릴 달린 낚싯대. 가방 · 리그에 넣고 한강 낚시터 물가에서 씁니다. 50번 던지면 부러집니다(줄이 끊기면 세 번 몫이 닳습니다)."
  };
  SX.BAIT = {
    name: "지렁이",
    w: 1,
    h: 1,
    val: 400,
    price: 1e3,
    kg: .05,
    noRaid: true,
    wt: 0,
    stack: true,
    unit: "마리",
    desc: "낚시 미끼. 한 번 던질 때마다 한 마리가 듭니다. 몇 마리든 한 칸에 모아 담습니다. 텃밭에서도 나옵니다."
  };
  SX.FISH_COOKED = {
    name: "구운 생선",
    w: 1,
    h: 1,
    val: 1200,
    kg: .3,
    noRaid: true,
    wt: 0,
    desc: "모닥불에 구운 생선. 날것보다 배가 훨씬 든든합니다."
  };
  SX.FISH_FOOD = {
    "구운 생선": [ 45, -5 ]
  };
  for (const f of SX.FISH) SX.FISH_FOOD[f.name] = [ 10, 0 ];
  const put = d => {
    if (!D.items.some(q => q.name === d.name)) D.items.push(Object.assign({}, d));
  };
  for (const f of SX.FISH) put({
    name: f.name,
    w: 1,
    h: 1,
    val: f.val,
    kg: f.kg[0],
    noRaid: true,
    wt: 0,
    fish: true,
    desc: f.desc
  });
  for (const j of SX.FISH_JUNK) put(Object.assign({
    noRaid: true,
    wt: 0
  }, j));
  put(SX.FISH_COOKED);
  put(SX.BAIT);
  if (!D.items.some(q => q.name === SX.ROD.name)) D.items.push(Object.assign({}, SX.ROD));
  SX.fishRoll = function(rnd) {
    rnd = rnd || Math.random;
    if (rnd() < SX.FISH_JUNK_P) return {
      junk: SX.FISH_JUNK[Math.floor(rnd() * SX.FISH_JUNK.length) % SX.FISH_JUNK.length]
    };
    const tot = SX.FISH.reduce((s, f) => s + f.w, 0);
    let r = rnd() * tot;
    for (const f of SX.FISH) {
      if ((r -= f.w) < 0) return {
        fish: f,
        kg: Math.round((f.kg[0] + (f.kg[1] - f.kg[0]) * Math.pow(rnd(), 1.6)) * 100) / 100
      };
    }
    const f = SX.FISH[0];
    return {
      fish: f,
      kg: f.kg[0]
    };
  };
})(window.SX);
