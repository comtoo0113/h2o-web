"use strict";

(function(SX) {
  const D = SX.data;
  const GUNS = [ {
    name: "K5 권총",
    cls: "pistol",
    caliber: "9mm",
    w: 3,
    h: 1,
    val: 45e3,
    price: 95e3,
    magSize: 13,
    dmg: 12,
    dmgHead: 30,
    rof: .14,
    vel: 55,
    reload: 1.1,
    spread: .035,
    kick: 1.2,
    bloom: .026,
    kg: .9,
    desc: "국군 제식 권총. 어디서나 굴러다니고 탄도 흔합니다."
  }, {
    name: ".38 리볼버",
    cls: "revolver",
    caliber: "9mm",
    w: 3,
    h: 1,
    val: 26e3,
    price: 6e4,
    magSize: 6,
    dmg: 16,
    dmgHead: 38,
    rof: .3,
    vel: 50,
    reload: 2.3,
    spread: .038,
    kick: 1.5,
    bloom: .02,
    kg: .8,
    desc: "경찰이 쓰던 육연발. 느리지만 한 발이 묵직합니다."
  }, {
    name: "K13 소음권총",
    cls: "pistol",
    caliber: "9mm",
    w: 3,
    h: 1,
    val: 15e4,
    price: 38e4,
    magSize: 15,
    dmg: 11,
    dmgHead: 27,
    rof: .16,
    vel: 48,
    reload: 1.2,
    spread: .032,
    kick: 1,
    bloom: .022,
    quiet: true,
    kg: 1.3,
    desc: "소음기를 물린 권총. 한 발 쏴도 옆방은 모릅니다."
  }, {
    name: "K1A 기관단총",
    cls: "smg",
    caliber: "5.56mm",
    w: 3,
    h: 1,
    val: 12e4,
    price: 3e5,
    magSize: 30,
    dmg: 32,
    dmgHead: 80,
    rof: .085,
    vel: 80,
    auto: true,
    reload: 1.5,
    spread: .05,
    kick: 1.7,
    bloom: .03,
    kg: 2.9,
    desc: "짧게 자른 5.56 단축형. 좁은 데서 좋고 반동이 셉니다."
  }, {
    name: "K7 소음기관단총",
    cls: "smg",
    caliber: "9mm",
    w: 3,
    h: 1,
    val: 26e4,
    price: 65e4,
    magSize: 30,
    dmg: 22,
    dmgHead: 54,
    rof: .07,
    vel: 46,
    auto: true,
    reload: 1.5,
    spread: .038,
    kick: 1,
    bloom: .02,
    quiet: true,
    kg: 3.4,
    desc: "총열째 소음기인 기관단총. 조용히 치울 때 씁니다."
  }, {
    name: "M16A1 소총",
    cls: "rifle",
    caliber: "5.56mm",
    w: 4,
    h: 1,
    val: 9e4,
    price: 23e4,
    magSize: 20,
    dmg: 40,
    dmgHead: 100,
    rof: .12,
    vel: 95,
    auto: true,
    reload: 1.7,
    spread: .032,
    kick: 1.5,
    bloom: .02,
    kg: 3.1,
    desc: "예비군 무기고에서 흘러나온 구형. 싸고 무난합니다."
  }, {
    name: "K2 소총",
    cls: "rifle",
    caliber: "5.56mm",
    w: 4,
    h: 1,
    val: 16e4,
    price: 42e4,
    magSize: 30,
    dmg: 44,
    dmgHead: 112,
    rof: .11,
    vel: 90,
    auto: true,
    reload: 1.6,
    spread: .028,
    kick: 1.6,
    bloom: .018,
    kg: 3.3,
    desc: "국군 제식 소총. 튼튼하고 탄창도 널렸습니다."
  }, {
    name: "K2C1 소총",
    cls: "rifle",
    caliber: "5.56mm",
    w: 4,
    h: 1,
    val: 26e4,
    price: 7e5,
    magSize: 30,
    dmg: 46,
    dmgHead: 118,
    rof: .1,
    vel: 92,
    look: 1.4,
    auto: true,
    reload: 1.55,
    spread: .022,
    kick: 1.5,
    bloom: .016,
    scope: true,
    kg: 3.6,
    desc: "레일에 조준경을 올린 개량형. 멀리 봐도 흔들림이 적습니다."
  }, {
    name: "K3 기관총",
    cls: "lmg",
    caliber: "5.56mm",
    w: 5,
    h: 2,
    val: 42e4,
    price: 12e5,
    magSize: 100,
    dmg: 40,
    dmgHead: 96,
    rof: .075,
    vel: 88,
    auto: true,
    reload: 3.4,
    spread: .055,
    kick: 2.2,
    bloom: .034,
    kg: 7.2,
    desc: "분대 지원 화기. 무겁지만 탄이 끝없이 나갑니다."
  }, {
    name: "K14 저격소총",
    cls: "sniper",
    caliber: "7.62mm",
    w: 5,
    h: 1,
    val: 62e4,
    price: 18e5,
    magSize: 10,
    dmg: 105,
    dmgHead: 260,
    rof: .95,
    vel: 150,
    look: 1.8,
    reload: 2.2,
    spread: .012,
    kick: 3,
    bloom: .01,
    scope: true,
    kg: 5.5,
    desc: "볼트를 당겨 한 발씩. 머리를 맞히면 그걸로 끝납니다."
  }, {
    name: "엽총",
    cls: "shotgun",
    caliber: "12게이지",
    w: 4,
    h: 2,
    val: 55e3,
    price: 13e4,
    magSize: 2,
    dmg: 31,
    dmgHead: 42,
    rof: .8,
    vel: 40,
    reload: 2.6,
    pellets: 9,
    spread: .055,
    falloff: 24,
    kick: 3,
    bloom: .05,
    kg: 3.2,
    desc: "수렵용 이중 총열. 두 발 쏘면 한참 꺾어 넣어야 합니다."
  }, {
    name: "USAS-12 산탄총",
    cls: "shotgun",
    caliber: "12게이지",
    w: 4,
    h: 2,
    val: 33e4,
    price: 9e5,
    magSize: 10,
    dmg: 28,
    dmgHead: 36,
    rof: .35,
    vel: 38,
    auto: true,
    reload: 2.4,
    pellets: 9,
    spread: .06,
    falloff: 24,
    kick: 3.4,
    bloom: .05,
    kg: 5.5,
    desc: "한국에서 만든 자동 산탄총. 복도를 통째로 쓸어버립니다."
  }, {
    name: "사제 파이프 권총",
    cls: "pistol",
    caliber: "9mm",
    w: 3,
    h: 1,
    val: 9e3,
    price: 28e3,
    magSize: 1,
    dmg: 15,
    dmgHead: 34,
    rof: .9,
    vel: 42,
    homemade: true,
    reload: 2.2,
    spread: .08,
    kick: 1.6,
    bloom: .03,
    kg: .7,
    desc: "쇠파이프에 공이와 고무줄. 한 발 쏘고 다시 끼웁니다. 철물점에서 만든 총."
  }, {
    name: "사제 산탄총",
    cls: "shotgun",
    caliber: "12게이지",
    w: 3,
    h: 1,
    val: 14e3,
    price: 45e3,
    magSize: 1,
    dmg: 26,
    dmgHead: 34,
    rof: 1,
    vel: 36,
    homemade: true,
    reload: 2.8,
    pellets: 7,
    spread: .09,
    falloff: 18,
    kick: 3.2,
    bloom: .05,
    kg: 2.4,
    desc: "수도관 두 개를 겹쳐 밀어 쏘는 슬램파이어. 가까이서만 믿을 만합니다."
  }, {
    name: "사제 기관단총",
    cls: "smg",
    caliber: "9mm",
    w: 3,
    h: 1,
    val: 6e4,
    price: 18e4,
    magSize: 20,
    dmg: 17,
    dmgHead: 40,
    rof: .1,
    vel: 44,
    homemade: true,
    auto: true,
    reload: 2,
    spread: .085,
    kick: 1.8,
    bloom: .06,
    kg: 2.6,
    desc: "철물점 부품으로 짠 자동 권총. 탄이 사방으로 튑니다."
  }, {
    name: "사제 사냥총",
    cls: "rifle",
    caliber: "7.62mm",
    w: 4,
    h: 1,
    val: 4e4,
    price: 12e4,
    magSize: 1,
    dmg: 60,
    dmgHead: 140,
    rof: 1.4,
    vel: 100,
    homemade: true,
    reload: 2.6,
    spread: .03,
    kick: 2.5,
    bloom: .02,
    kg: 3.4,
    desc: "볼트 하나짜리 사제 장총. 한 발 값은 합니다. 멧돼지 잡던 사람 것."
  } ];
  const MAGS = [ {
    name: "9mm 탄창",
    caliber: "9mm",
    cap: 30,
    val: 8e3,
    w: 1,
    h: 1
  }, {
    name: "5.56mm 탄창",
    caliber: "5.56mm",
    cap: 30,
    val: 12e3,
    w: 1,
    h: 2
  }, {
    name: "5.56mm 탄통",
    caliber: "5.56mm",
    cap: 100,
    val: 42e3,
    w: 2,
    h: 2
  }, {
    name: "7.62mm 탄창",
    caliber: "7.62mm",
    cap: 10,
    val: 16e3,
    w: 1,
    h: 2
  }, {
    name: "12게이지 탄",
    caliber: "12게이지",
    cap: 10,
    val: 11500,
    w: 1,
    h: 1
  }, {
    name: "9mm 탄 상자",
    caliber: "9mm",
    cap: 120,
    val: 32e3,
    w: 1,
    h: 1,
    box: true
  }, {
    name: "5.56mm 탄 상자",
    caliber: "5.56mm",
    cap: 240,
    val: 96e3,
    w: 2,
    h: 1,
    box: true
  }, {
    name: "7.62mm 탄 상자",
    caliber: "7.62mm",
    cap: 100,
    val: 16e4,
    w: 2,
    h: 1,
    box: true
  }, {
    name: "12게이지 탄 상자",
    caliber: "12게이지",
    cap: 80,
    val: 92e3,
    w: 2,
    h: 1,
    box: true
  } ];
  const AMMO = [ {
    name: "9mm 탄약상자",
    kind: "ammo",
    cal: "9mm",
    price: 11e4
  }, {
    name: "5.56mm 탄약상자",
    kind: "ammo",
    cal: "5.56mm",
    price: 15e4
  }, {
    name: "7.62mm 탄약상자",
    kind: "ammo",
    cal: "7.62mm",
    price: 22e4
  }, {
    name: "12게이지 탄약상자",
    kind: "ammo",
    cal: "12게이지",
    price: 15e4
  }, {
    name: "5.56mm 탄통 한 개",
    kind: "ammo",
    cal: "5.56mm",
    one: "5.56mm 탄통",
    price: 17e4
  } ];
  const mkGun = g => Object.assign({
    kind: "gun",
    ammo: g.magSize
  }, g);
  const mkMag = m => Object.assign({
    kind: "mag",
    ammo: m.cap
  }, m);
  D.guns = GUNS.map(mkGun);
  D.mags = MAGS.map(mkMag);
  SX.gunDefs = D.guns;
  SX.magDefs = D.mags;
  SX.CALIBERS = [ "9mm", "5.56mm", "7.62mm", "12게이지" ];
  SX.AMMO_BOX = {
    "9mm": "9mm 탄 상자",
    "5.56mm": "5.56mm 탄 상자",
    "7.62mm": "7.62mm 탄 상자",
    "12게이지": "12게이지 탄 상자"
  };
  SX.OLD_NAMES = {
    권총: "K5 권총",
    소총: "K2 소총",
    샷건: "USAS-12 산탄총",
    "7mm 탄창": "5.56mm 탄창",
    "7mm 탄약상자": "5.56mm 탄약상자",
    "모르핀 주사기": "진통 주사기",
    "지포 라이터": "기름 라이터",
    "스팸 통조림": "햄 통조림",
    "마약류 보관실 열쇠": "약품 보관실 열쇠",
    딱풀: "고체 풀"
  };
  const byName = n => D.guns.find(g => g.name === n);
  const shopGun = (n, p) => Object.assign({}, byName(n), {
    price: p != null ? p : byName(n).price
  });
  const gunStall = D.stalls.find(s => s.id === "gun");
  if (gunStall) {
    const keep = gunStall.pool.filter(d => d.kind !== "gun");
    const always = (gunStall.always || []).filter(d => d.kind !== "gun");
    gunStall.always = [ shopGun("사제 파이프 권총"), shopGun("사제 산탄총") ].concat(always);
    gunStall.pool = [ "K5 권총", ".38 리볼버", "엽총", "사제 기관단총", "사제 사냥총" ].map(n => shopGun(n)).concat(keep);
    gunStall.n = 2;
  }
  const ammoStall = D.stalls.find(s => s.id === "ammo");
  if (ammoStall) {
    const keep = ammoStall.pool.filter(d => d.kind !== "ammo" && d.kind !== "mag");
    const single = D.mags.filter(m => m.cap <= 30).map(m => Object.assign({}, m, {
      ammo: m.cap,
      price: Math.round(m.val * 4.5 / 100) * 100
    }));
    ammoStall.always = AMMO.slice(0, 1);
    ammoStall.pool = AMMO.slice(1).concat(single, keep);
    ammoStall.n = 2;
  }
  D.shop = D.shop.filter(d => d.kind !== "gun" && d.kind !== "ammo");
  D.shop.unshift(shopGun("사제 파이프 권총"), shopGun("K5 권총"), AMMO[0], AMMO[1]);
  for (const d of D.specials || []) if (d.kind === "mag" || /탄창|탄$/.test(d.name || "")) d.wt = Math.max(.2, (d.wt || 1) * .5);
  if (Array.isArray(D.smuggle)) {
    D.smuggle = D.smuggle.filter(s => !(s.item && s.item.kind === "gun"));
    D.smuggle.unshift({
      name: "USAS-12 산탄총",
      base: 105e4,
      item: byName("USAS-12 산탄총")
    }, {
      name: "K14 저격소총",
      base: 21e5,
      item: byName("K14 저격소총")
    }, {
      name: "K7 소음기관단총",
      base: 78e4,
      item: byName("K7 소음기관단총")
    }, {
      name: "M16A1 소총",
      base: 37e4,
      item: byName("M16A1 소총")
    }, {
      name: "K1A 기관단총",
      base: 48e4,
      item: byName("K1A 기관단총")
    }, {
      name: "K2 소총",
      base: 67e4,
      item: byName("K2 소총")
    }, {
      name: "K2C1 소총",
      base: 11e5,
      item: byName("K2C1 소총")
    }, {
      name: "K3 기관총",
      base: 19e5,
      item: byName("K3 기관총")
    });
  }
  SX.AMMO_TYPES = {
    ap: {
      name: "철갑탄",
      tag: "AP",
      col: "#e8c040",
      ink: "#2a2410",
      pen: 1,
      dmg: .9,
      armorAdd: .35,
      helm: .7,
      val: 1.8
    },
    hp: {
      name: "할로포인트",
      tag: "HP",
      col: "#d84838",
      ink: "#fff4ec",
      pen: -1,
      dmg: 1.25,
      armorMul: .6,
      helm: .3,
      val: 1.35
    }
  };
  SX.SLUG = {
    name: "슬러그",
    tag: "SL",
    k: .36,
    range: 36,
    falloff: 48
  };
  SX.ammoTypeName = (cal, at) => !at || !SX.AMMO_TYPES[at] ? "보통탄" : at === "hp" && cal === "12게이지" ? SX.SLUG.name : SX.AMMO_TYPES[at].name;
  SX.ammoTypeTag = (cal, at) => !at || !SX.AMMO_TYPES[at] ? "" : at === "hp" && cal === "12게이지" ? SX.SLUG.tag : SX.AMMO_TYPES[at].tag;
  const TYPED = [ [ "9mm", "ap", "9mm 철갑탄 탄창", "9mm 철갑탄 상자" ], [ "9mm", "hp", "9mm 할로포인트 탄창", "9mm 할로포인트 상자" ], [ "5.56mm", "ap", "5.56mm 철갑탄 탄창", "5.56mm 철갑탄 상자" ], [ "5.56mm", "hp", "5.56mm 할로포인트 탄창", "5.56mm 할로포인트 상자" ], [ "7.62mm", "ap", "7.62mm 철갑탄 탄창", "7.62mm 철갑탄 상자" ], [ "7.62mm", "hp", "7.62mm 할로포인트 탄창", "7.62mm 할로포인트 상자" ], [ "12게이지", "ap", "12게이지 철갑탄", "12게이지 철갑탄 상자" ], [ "12게이지", "hp", "12게이지 슬러그", "12게이지 슬러그 상자" ] ];
  const MAG0 = {
    "9mm": "9mm 탄창",
    "5.56mm": "5.56mm 탄창",
    "7.62mm": "7.62mm 탄창",
    "12게이지": "12게이지 탄"
  };
  SX.AMMO_MAG = {};
  SX.AMMO_BOXES = {};
  for (const cal of SX.CALIBERS) {
    SX.AMMO_MAG[cal] = {
      "": MAG0[cal]
    };
    SX.AMMO_BOXES[cal] = {
      "": SX.AMMO_BOX[cal]
    };
  }
  for (const [cal, at, mn, bn] of TYPED) {
    const T = SX.AMMO_TYPES[at];
    for (const [nm, base, M] of [ [ mn, MAG0[cal], SX.AMMO_MAG ], [ bn, SX.AMMO_BOX[cal], SX.AMMO_BOXES ] ]) {
      const b = D.mags.find(m => m.name === base);
      if (!b) continue;
      D.mags.push(Object.assign({}, b, {
        name: nm,
        ammoType: at,
        pic: base,
        val: Math.round(b.val * T.val / 100) * 100
      }));
      M[cal][at] = nm;
    }
  }
  if (ammoStall) for (const m of D.mags) if (m.ammoType && !m.box) ammoStall.pool.push(Object.assign({}, m, {
    ammo: m.cap,
    price: Math.round(m.val * 4.5 / 100) * 100,
    odds: m.ammoType === "ap" ? .3 : .5
  }));
  if (Array.isArray(D.smuggle)) for (const n of [ "5.56mm 철갑탄 상자", "7.62mm 철갑탄 상자" ]) {
    const m = D.mags.find(q => q.name === n);
    if (m) D.smuggle.push({
      name: n,
      base: Math.round(m.val * 1.5 / 1e3) * 1e3,
      item: Object.assign({}, m)
    });
  }
  SX.ENEMY_AMMO = [ [ .1, 0 ], [ .12, .03 ], [ .12, .1 ], [ .1, .2 ] ];
  const SMALL = [ "pistol", "smg" ], LONG = [ "smg", "rifle", "lmg", "sniper" ], MAGGY = [ "pistol", "smg", "rifle", "sniper", "shotgun" ];
  const PARTS = [ {
    name: "권총 소음기",
    slot: "muzzle",
    cls: SMALL,
    cal: [ "9mm" ],
    w: 2,
    h: 1,
    kg: .25,
    val: 55e3,
    price: 14e4,
    fx: {
      quiet: true,
      fuzz: 3,
      flash: .2,
      kick: .9
    },
    desc: "9mm 총구에 돌려 끼웁니다. 총소리가 멀리 안 퍼지고(적이 듣는 거리 30칸 → 7칸) 불빛도 거의 없습니다."
  }, {
    name: "소총 소음기",
    slot: "muzzle",
    cls: LONG,
    cal: [ "5.56mm", "7.62mm" ],
    w: 2,
    h: 1,
    kg: .5,
    val: 11e4,
    price: 28e4,
    fx: {
      quiet: true,
      fuzz: 3,
      flash: .2,
      kick: .9
    },
    desc: "5.56·7.62 총구용. 멀리서는 총소리가 잘 안 들립니다(30칸 → 7칸). 반동도 조금 줄어듭니다."
  }, {
    name: "보정기",
    slot: "muzzle",
    cls: [ "smg", "rifle", "lmg" ],
    w: 1,
    h: 1,
    kg: .15,
    val: 35e3,
    price: 9e4,
    fx: {
      bloom: .6,
      kick: .7,
      noise: 1.15
    },
    desc: "가스를 위로 빼서 총구가 덜 뜁니다. 연사할 때 탄이 덜 흐트러집니다. 소리는 조금 더 큽니다."
  }, {
    name: "소염기",
    slot: "muzzle",
    cls: LONG,
    w: 1,
    h: 1,
    kg: .12,
    val: 25e3,
    price: 65e3,
    fx: {
      flash: .1,
      fuzz: 4,
      bloom: .88
    },
    desc: "총구 불빛을 가립니다. 적이 소리는 들어도 어디서 쐈는지 몇 칸 어긋나게 압니다. 반동도 조금 줄어듭니다."
  }, {
    name: "산탄 초크",
    slot: "muzzle",
    cls: [ "shotgun" ],
    w: 1,
    h: 1,
    kg: .1,
    val: 25e3,
    price: 65e3,
    fx: {
      choke: .62
    },
    desc: "총구를 조여 산탄이 덜 퍼집니다. 조금 먼 적에게도 알갱이가 몰려 박힙니다."
  }, {
    name: "대용량 탄창",
    slot: "mag",
    cls: MAGGY,
    w: 1,
    h: 2,
    kg: .3,
    val: 45e3,
    price: 12e4,
    fx: {
      mag: 1.5,
      reload: 1.1
    },
    desc: "장탄이 1.5배. 무거워서 갈아 끼우는 데 조금 더 걸립니다."
  }, {
    name: "퀵드로우 탄창",
    slot: "mag",
    cls: MAGGY,
    w: 1,
    h: 1,
    kg: .15,
    val: 35e3,
    price: 95e3,
    fx: {
      reload: .7
    },
    desc: "당김 고리를 단 탄창. 재장전이 30% 빠릅니다."
  }, {
    name: "대용량 퀵드로우 탄창",
    slot: "mag",
    cls: MAGGY,
    w: 1,
    h: 2,
    kg: .35,
    val: 95e3,
    price: 26e4,
    fx: {
      mag: 1.5,
      reload: .75
    },
    desc: "둘 다 됩니다 — 장탄 1.5배에 재장전도 빠릅니다. 귀합니다."
  }, {
    name: "스피드로더",
    slot: "mag",
    cls: [ "revolver" ],
    w: 1,
    h: 1,
    kg: .1,
    val: 15e3,
    price: 4e4,
    fx: {
      reload: .5
    },
    desc: "여섯 발을 한 번에 밀어 넣는 고리. 리볼버 장전이 절반으로."
  }, {
    name: "수직 손잡이",
    slot: "grip",
    cls: [ "smg", "rifle", "lmg" ],
    w: 1,
    h: 1,
    kg: .2,
    val: 28e3,
    price: 75e3,
    fx: {
      bloom: .75,
      kick: .85
    },
    desc: "앞손으로 꽉 쥡니다. 연사할 때 탄이 덜 흐트러지고 덜 흔들립니다."
  }, {
    name: "앵글 손잡이",
    slot: "grip",
    cls: [ "smg", "rifle", "lmg" ],
    w: 1,
    h: 1,
    kg: .2,
    val: 28e3,
    price: 75e3,
    fx: {
      rate: 1.8,
      ads: .92
    },
    desc: "비스듬히 받칩니다. 조준 사격하면 탄퍼짐이 훨씬 빨리 모입니다."
  }, {
    name: "레드닷 사이트",
    slot: "sight",
    cls: [ "pistol", "smg", "rifle", "lmg", "shotgun" ],
    w: 1,
    h: 1,
    kg: .15,
    val: 3e4,
    price: 8e4,
    fx: {
      ads: .8
    },
    desc: "붉은 점 하나. 조준 사격하면 탄이 20% 덜 퍼집니다."
  }, {
    name: "홀로그램 사이트",
    slot: "sight",
    cls: [ "smg", "rifle", "lmg", "shotgun" ],
    w: 1,
    h: 1,
    kg: .2,
    val: 38e3,
    price: 1e5,
    fx: {
      ads: .85,
      rate: 1.35
    },
    desc: "넓은 창에 뜨는 조준선. 조준 사격 퍼짐이 줄고 빨리 모입니다."
  }, {
    name: "4배율 조준경",
    slot: "sight",
    cls: [ "rifle", "lmg" ],
    w: 2,
    h: 1,
    kg: .45,
    val: 85e3,
    price: 23e4,
    fx: {
      scope: true,
      ads: .65,
      look: 1.4,
      rate: .8
    },
    desc: "조준 사격하면 둥근 창으로 더 멀리 봅니다. 조준 사격 퍼짐이 크게 줄어듭니다. 대신 모이는 데 조금 더 걸립니다."
  }, {
    name: "전술 개머리판",
    slot: "stock",
    cls: [ "smg", "rifle", "sniper" ],
    w: 2,
    h: 1,
    kg: .4,
    val: 38e3,
    price: 1e5,
    fx: {
      move: .55,
      kick: .88
    },
    desc: "어깨에 단단히 붙습니다. 걸으면서 쏴도 덜 퍼집니다."
  }, {
    name: "레이저 사이트",
    slot: "laser",
    cls: [ "pistol", "revolver", "smg", "rifle", "lmg", "shotgun" ],
    w: 1,
    h: 1,
    kg: .1,
    val: 4e4,
    price: 11e4,
    fx: {
      hip: .7,
      laser: true
    },
    desc: "붉은 줄이 총구에서 뻗습니다. 지향 사격(조준 없이 쏘기) 때 탄이 30% 덜 퍼집니다."
  } ].map(p => Object.assign({
    kind: "part"
  }, p));
  D.parts = PARTS;
  SX.PART_SLOTS = [ "muzzle", "mag", "grip", "sight", "stock", "laser" ];
  SX.PART_SLOT_NAMES = {
    muzzle: "총구",
    mag: "탄창",
    grip: "손잡이",
    sight: "조준기",
    stock: "개머리판",
    laser: "레이저"
  };
  const gunDef = g => D.guns.find(q => q.name === g.name) || g;
  const partDef = p => PARTS.find(q => q.name === p.name) || p;
  SX.partDef = partDef;
  SX.partFitsDef = (p, d) => !!p && !!d && (p.cls || []).indexOf(d.cls) >= 0 && (!p.cal || p.cal.indexOf(d.caliber) >= 0);
  SX.partSlots = function(g) {
    if (!g || g.kind !== "gun") return [];
    const d = gunDef(g), out = [];
    for (const s of SX.PART_SLOTS) {
      if (s === "muzzle" && d.quiet) continue;
      if (s === "sight" && d.scope) continue;
      if (s === "mag" && (d.cls === "lmg" || (d.magSize || 0) <= 2)) continue;
      if (s === "sight" && d.cls === "shotgun" && (d.magSize || 0) <= 2) continue;
      if (PARTS.some(p => p.slot === s && SX.partFitsDef(p, d))) out.push(s);
    }
    return out;
  };
  SX.partFits = function(p, g) {
    if (!p || p.kind !== "part" || !g || g.kind !== "gun") return false;
    const pd = partDef(p);
    return SX.partSlots(g).indexOf(pd.slot) >= 0 && SX.partFitsDef(pd, gunDef(g));
  };
  SX.partsFor = g => PARTS.filter(p => SX.partFits(p, g)).map(p => p.name);
  if (!D.stalls.find(s => s.id === "parts")) D.stalls.push({
    id: "parts",
    name: "총 부품상",
    n: 5,
    always: [],
    pool: PARTS.map(p => Object.assign({}, p))
  });
  SX.LOOT_GUNS = [ "사제 파이프 권총", "사제 파이프 권총", "사제 파이프 권총", "사제 산탄총", "사제 산탄총", ".38 리볼버", ".38 리볼버", "K5 권총", "K5 권총", "엽총", "엽총", "사제 기관단총", "사제 사냥총", "M16A1 소총", "K1A 기관단총", "K2 소총", "K7 소음기관단총", "K2C1 소총", "USAS-12 산탄총", "K14 저격소총", "K3 기관총" ];
  SX.ENEMY_GUNS = {
    pistol: [ "사제 파이프 권총", "K5 권총" ],
    rifle: [ "M16A1 소총", "K2 소총", "사제 사냥총" ]
  };
  SX.ENEMY_GUN_TIERS = [ [ [ "사제 파이프 권총", 6 ], [ "사제 산탄총", 3 ], [ ".38 리볼버", 2 ], [ "K5 권총", 1 ] ], [ [ "사제 파이프 권총", 3 ], [ "사제 산탄총", 3 ], [ "사제 기관단총", 2 ], [ "K5 권총", 3 ], [ ".38 리볼버", 2 ], [ "엽총", 2 ], [ "M16A1 소총", 1 ] ], [ [ "사제 기관단총", 3 ], [ "K5 권총", 2 ], [ "엽총", 2 ], [ "사제 사냥총", 2 ], [ "M16A1 소총", 3 ], [ "K1A 기관단총", 2 ], [ "K2 소총", 2 ], [ "K7 소음기관단총", 1 ] ], [ [ "K2 소총", 4 ], [ "K2C1 소총", 3 ], [ "K1A 기관단총", 2 ], [ "K7 소음기관단총", 2 ], [ "USAS-12 산탄총", 1 ], [ "K3 기관총", 2 ], [ "K14 저격소총", 1 ], [ "사제 사냥총", 1 ] ] ];
  const ARMORS = [ {
    name: "방검복",
    kind: "armor",
    cls: 1,
    armor: 300,
    kg: 1.2,
    slow: 0,
    val: 22e3,
    price: 38e3,
    w: 2,
    h: 2,
    desc: "칼·손톱을 막는 얇은 조끼. 총알은 못 막습니다."
  }, {
    name: "소프트 방탄조끼",
    kind: "armor",
    cls: 2,
    armor: 380,
    kg: 2.2,
    slow: 0,
    val: 45e3,
    price: 72e3,
    w: 2,
    h: 2,
    desc: "옷 안에 입는 방탄조끼. 권총탄·산탄을 막습니다."
  }, {
    name: "방탄조끼",
    kind: "armor",
    cls: 3,
    armor: 450,
    kg: 3.5,
    slow: .02,
    val: 85e3,
    price: 1e5,
    w: 2,
    h: 2,
    desc: "경찰 특공대 조끼. 권총탄·산탄·파편을 막습니다. 소총탄은 조금 줄일 뿐입니다."
  }, {
    name: "방탄판 조끼",
    kind: "armor",
    cls: 4,
    armor: 550,
    kg: 5.5,
    slow: .04,
    val: 19e4,
    price: 28e4,
    w: 2,
    h: 2,
    desc: "앞뒤로 세라믹 판을 넣었습니다. 5.56 소총탄을 막습니다."
  }, {
    name: "군용 방탄복",
    kind: "armor",
    cls: 5,
    armor: 650,
    kg: 8,
    slow: .07,
    val: 38e4,
    price: 56e4,
    w: 2,
    h: 2,
    desc: "국군 방탄복에 판을 더 댔습니다. 7.62 저격탄까지 막습니다. 무겁습니다."
  }, {
    name: "중전투 방탄복",
    kind: "armor",
    cls: 6,
    armor: 850,
    kg: 12,
    slow: .11,
    val: 72e4,
    price: 108e4,
    w: 3,
    h: 3,
    desc: "목·어깨까지 감싸는 폭발물 처리반 방탄복. 무엇이든 막지만 걸음이 느려집니다."
  }, {
    name: "공사장 안전모",
    kind: "helmet",
    cls: 1,
    armor: 200,
    kg: .4,
    slow: 0,
    val: 8e3,
    price: 14e3,
    w: 2,
    h: 2,
    desc: "떨어지는 벽돌과 손톱 정도는 막습니다."
  }, {
    name: "경찰 방석모",
    kind: "helmet",
    cls: 2,
    armor: 260,
    kg: .9,
    slow: 0,
    val: 26e3,
    price: 42e3,
    w: 2,
    h: 2,
    desc: "권총탄을 막는 경찰 헬멧."
  }, {
    name: "방탄모",
    kind: "helmet",
    cls: 3,
    armor: 350,
    kg: 1.4,
    slow: 0,
    val: 55e3,
    price: 66e3,
    w: 2,
    h: 2,
    desc: "국군 방탄모. 권총탄·산탄·파편을 막습니다."
  }, {
    name: "전술 헬멧",
    kind: "helmet",
    cls: 4,
    armor: 450,
    kg: 1.2,
    slow: 0,
    val: 15e4,
    price: 22e4,
    w: 2,
    h: 2,
    desc: "가벼운 신소재 헬멧. 5.56 소총탄을 막습니다."
  }, {
    name: "중형 방탄 헬멧",
    kind: "helmet",
    cls: 5,
    armor: 600,
    kg: 2.4,
    slow: .02,
    val: 32e4,
    price: 47e4,
    w: 2,
    h: 2,
    desc: "얼굴 가리개가 달린 무거운 헬멧. 7.62 까지 막습니다."
  } ].map(a => Object.assign({
    armorMax: a.armor
  }, a));
  SX.ARMORS = ARMORS;
  {
    const gear = D.stalls.find(s => s.id === "gear");
    if (gear) for (const a of ARMORS) {
      const old = gear.pool.find(q => q.name === a.name);
      if (old) Object.assign(old, a); else gear.pool.push(Object.assign({}, a));
    }
    for (const L of [ D.items || [], D.specials || [], D.shop || [] ]) for (const d of L) {
      const a = ARMORS.find(q => q.name === d.name);
      if (a) Object.assign(d, {
        cls: a.cls,
        kg: a.kg,
        slow: a.slow,
        desc: a.desc,
        armor: a.armor,
        armorMax: a.armorMax
      });
    }
    for (const q of D.smuggle || []) {
      const a = q.item && ARMORS.find(z => z.name === q.item.name);
      if (a) Object.assign(q.item, {
        cls: a.cls,
        kg: a.kg,
        slow: a.slow,
        desc: a.desc,
        armor: a.armor,
        armorMax: a.armorMax
      });
    }
    if (D.helmet) {
      const a = ARMORS.find(q => q.name === D.helmet.name);
      if (a) Object.assign(D.helmet, {
        cls: a.cls,
        kg: a.kg,
        slow: a.slow,
        desc: a.desc,
        armor: a.armor,
        armorMax: a.armorMax
      });
    }
  }
  SX.AFIX = {
    name: "방탄 수리 키트",
    kind: "afix",
    w: 2,
    h: 1,
    val: 1e6,
    price: 15e5,
    kg: 1.4,
    wt: 0,
    afix: 400,
    cast: 8,
    desc: "방탄판 조각 · 아라미드 천 · 접착제 한 벌. 판 안에서도 씁니다 — 입은 방탄복·방탄모 중 더 닳은 쪽 내구를 400 채웁니다(8초 · 쓰는 동안 못 쏩니다). 아주 비쌉니다."
  };
  {
    const gear = D.stalls.find(s => s.id === "gear");
    if (gear) {
      gear.always = gear.always || [];
      if (!gear.always.some(d => d.name === SX.AFIX.name)) gear.always.push(Object.assign({}, SX.AFIX));
    }
  }
  {
    const gear = D.stalls.find(s => s.id === "gear"), bp = gear && gear.pool.find(d => d.name === "배낭");
    if (bp) {
      gear.pool = gear.pool.filter(d => d !== bp);
      if (!gear.always.some(d => d.name === "배낭")) gear.always.push(Object.assign({}, bp));
    }
  }
  SX.BAG_FOLD = {
    "천 가방": [ 1, 1 ],
    "작은 가방": [ 1, 1 ],
    "긴 가방": [ 1, 2 ],
    배낭: [ 2, 1 ]
  };
  SX.ARMOR_TIERS = {
    armor: [ [ [ "방검복", 5 ], [ "소프트 방탄조끼", 4 ], [ "방탄조끼", 1 ] ], [ [ "소프트 방탄조끼", 4 ], [ "방탄조끼", 4 ], [ "방탄판 조끼", 1 ] ], [ [ "방탄조끼", 4 ], [ "방탄판 조끼", 3 ], [ "군용 방탄복", 1 ] ], [ [ "방탄판 조끼", 4 ], [ "군용 방탄복", 3 ], [ "중전투 방탄복", 1 ] ] ],
    helmet: [ [ [ "공사장 안전모", 5 ], [ "경찰 방석모", 3 ], [ "방탄모", 1 ] ], [ [ "경찰 방석모", 4 ], [ "방탄모", 4 ], [ "전술 헬멧", 1 ] ], [ [ "방탄모", 4 ], [ "전술 헬멧", 3 ], [ "중형 방탄 헬멧", 1 ] ], [ [ "전술 헬멧", 4 ], [ "중형 방탄 헬멧", 2 ] ] ]
  };
  const MEDS = [ {
    name: "붕대",
    hot: 20,
    dur: 6,
    cast: 3,
    stop: "L",
    desc: "상처를 감습니다. 가벼운 출혈을 멈추고 천천히 조금 낫습니다."
  }, {
    name: "지혈대",
    heal: 5,
    cast: 2,
    stop: "H",
    desc: "팔다리를 세게 묶습니다. 심한 출혈까지 모든 출혈을 멈춥니다."
  }, {
    name: "진통제",
    heal: 10,
    cast: 2,
    desc: "알약. 체력이 조금 오릅니다."
  }, {
    name: "소독약",
    heal: 10,
    cast: 4,
    desc: "상처를 닦습니다. 체력이 조금 오릅니다."
  }, {
    name: "진통 주사기",
    heal: 30,
    cast: 1.2,
    desc: "주사 한 대. 금방 놓고 체력이 30 오릅니다."
  }, {
    name: "항생제",
    heal: 20,
    cast: 5,
    desc: "알약. 체력이 20 오릅니다."
  }, {
    name: "구급킷",
    heal: 50,
    cast: 5,
    stop: "L",
    desc: "많이 회복합니다. 가벼운 출혈도 멈춥니다."
  } ];
  const NEW_MEDS = [ {
    name: "에너지 드링크",
    kind: "heal",
    w: 1,
    h: 2,
    val: 9e3,
    price: 15e3,
    wt: 6,
    cast: 1.5,
    stam: 60,
    desc: "기력이 가득 차고, 1분 동안 달려도 기력이 절반만 닳습니다."
  }, {
    name: "군용 응급 파우치",
    kind: "heal",
    w: 1,
    h: 2,
    val: 15e4,
    price: 22e4,
    wt: 1,
    heal: 40,
    cast: 3,
    stop: "H",
    desc: "군 전투 응급 처치 묶음. 체력 40 · 모든 출혈 멈춤."
  }, {
    name: "수술 키트",
    kind: "heal",
    w: 2,
    h: 2,
    val: 3e5,
    price: 45e4,
    wt: 1,
    heal: 100,
    cast: 12,
    stop: "H",
    desc: "오래 걸리지만 다 고칩니다. 체력 가득 · 모든 출혈 멈춤."
  }, {
    name: "아드레날린 주사",
    kind: "heal",
    w: 1,
    h: 1,
    val: 9e4,
    price: 14e4,
    wt: 1,
    bonus: 25,
    bonusT: 180,
    stam: 20,
    cast: 1,
    desc: "3분 동안 최대 체력 +25(그만큼 차오릅니다) · 기력 가득."
  } ];
  {
    const lists = [ D.items, D.specials || [], D.shop || [] ].concat(D.stalls.map(s => s.pool.concat(s.always)));
    for (const m of MEDS) for (const L of lists) for (const d of L) if (d.name === m.name) {
      delete d.heal;
      delete d.hot;
      delete d.dur;
      Object.assign(d, m);
    }
    for (const m of NEW_MEDS) if (!(D.specials || []).some(d => d.name === m.name)) (D.specials || (D.specials = [])).push(Object.assign({}, m));
    const med = D.stalls.find(s => s.id === "med");
    if (med) for (const m of NEW_MEDS) if (!med.pool.some(d => d.name === m.name)) med.pool.push(Object.assign({}, m));
  }
  SX.MED_NAMES = MEDS.concat(NEW_MEDS).map(m => m.name);
  SX.INJURIES = {
    bleedH: {
      name: "심한 출혈",
      fix: "지혈대 · 군용 응급 파우치 · 수술 키트",
      col: "#ff4a4a",
      icon: "bleedH",
      tip: "초당 체력 1씩 샙니다"
    },
    bleedL: {
      name: "가벼운 출혈",
      fix: "붕대 · 구급킷 · 지혈대",
      col: "#e0714a",
      icon: "bleed",
      tip: "초당 체력 0.35씩 샙니다"
    }
  };
  SX.PARTBOX = {
    "하급 파츠 상자": {
      n: 4,
      pool: [ "스피드로더", "소염기", "산탄 초크", "수직 손잡이", "앵글 손잡이", "레드닷 사이트" ]
    },
    "중급 파츠 상자": {
      n: 4,
      pool: [ "보정기", "퀵드로우 탄창", "홀로그램 사이트", "전술 개머리판", "레이저 사이트", "대용량 탄창" ]
    },
    "상급 파츠 상자": {
      n: 3,
      pool: [ "권총 소음기", "4배율 조준경", "대용량 퀵드로우 탄창", "소총 소음기" ]
    }
  };
  for (const [name, b, val, wt] of [ [ "하급 파츠 상자", 0, 3e3, 2 ], [ "중급 파츠 상자", 0, 5e3, 1 ], [ "상급 파츠 상자", 0, 8e3, 0 ] ]) if (!(D.specials || []).some(d => d.name === name)) D.specials.push({
    name,
    kind: "partbox",
    w: 1,
    h: 2,
    val,
    wt,
    desc: "정비 작업대에서 깎은 파츠를 담은 상자입니다. 우클릭으로 엽니다."
  });
  for (const d of [ {
    name: "리튬 배터리 팩",
    w: 1,
    h: 1,
    val: 11e4,
    kg: .6,
    desc: "충전된 리튬 배터리 묶음. 전기가 귀해서 비싸게 팔립니다."
  }, {
    name: "차량용 배터리",
    w: 2,
    h: 1,
    val: 2e5,
    kg: 12,
    desc: "자동차 납축전지. 무겁지만 집 한 채 불을 밝힙니다."
  }, {
    name: "태양광 충전기",
    w: 2,
    h: 2,
    val: 4e5,
    kg: 3,
    desc: "접이식 태양광 판과 충전기. 전기를 스스로 만듭니다."
  }, {
    name: "증류 소주 짝",
    w: 2,
    h: 2,
    val: 12e4,
    kg: 6,
    desc: "직접 내린 소주 한 짝. 장터에서 잘 팔립니다."
  }, {
    name: "전통 청주 상자",
    w: 2,
    h: 2,
    val: 2e5,
    kg: 7,
    desc: "맑게 거른 청주 여러 병. 귀한 술입니다."
  }, {
    name: "숙성 양주",
    w: 1,
    h: 2,
    val: 3e5,
    kg: 1.2,
    desc: "오크통에서 숙성한 독한 술. 한 병 값이 비쌉니다."
  } ]) if (!D.items.some(q => q.name === d.name)) D.items.push(Object.assign({
    wt: 0,
    kind: "junk"
  }, d));
  SX.rollPartBox = function(name, rnd) {
    const P = SX.PARTBOX[name];
    if (!P) return [];
    rnd = rnd || Math.random;
    const out = [];
    for (let k = 0; k < P.n; k++) out.push(P.pool[Math.floor(rnd() * P.pool.length) % P.pool.length]);
    return out;
  };
  SX.pickArmor = function(rng, kind, tier) {
    const list = SX.ARMOR_TIERS[kind][Math.max(1, Math.min(4, tier | 0)) - 1], tot = list.reduce((s, q) => s + q[1], 0);
    let r = rng.f() * tot;
    for (const [n, w] of list) {
      if ((r -= w) < 0) return n;
    }
    return list[0][0];
  };
  SX.enemyGun = function(rng, tier) {
    const list = SX.ENEMY_GUN_TIERS[Math.max(1, Math.min(4, tier | 0)) - 1], tot = list.reduce((s, q) => s + q[1], 0);
    let r = rng.f() * tot;
    for (const [n, w] of list) {
      if ((r -= w) < 0) return n;
    }
    return list[0][0];
  };
})(window.SX);
