"use strict";

(function(SX) {
  const T = SX.trade = {};
  const D = SX.data;
  T.WHO = [ "gun", "ammo", "med", "gear", "parts", "smuggle" ];
  T.NAME = {
    gun: "무기상",
    ammo: "탄약상",
    med: "약재상",
    gear: "방어구상",
    parts: "총 부품상",
    smuggle: "밀수꾼"
  };
  T.LV = [ {
    n: 1,
    name: "처음 손님",
    disc: 0,
    sell: 0,
    slot: 0,
    rare: 0
  }, {
    n: 2,
    name: "단골",
    disc: .03,
    sell: .02,
    slot: 1,
    rare: 0
  }, {
    n: 3,
    name: "오랜 단골",
    disc: .06,
    sell: .04,
    slot: 1,
    rare: .6
  }, {
    n: 4,
    name: "한식구",
    disc: .1,
    sell: .06,
    slot: 2,
    rare: 1
  } ];
  T.NEED = {
    gun: [ 0, 2e6, 8e6, 25e6 ],
    ammo: [ 0, 1e6, 4e6, 125e5 ],
    med: [ 0, 3e6, 12e6, 375e5 ],
    gear: [ 0, 2e6, 8e6, 25e6 ],
    parts: [ 0, 1e6, 4e6, 125e5 ],
    smuggle: [ 0, 4e6, 16e6, 5e7 ]
  };
  T.loyNew = () => ({
    gun: 0,
    ammo: 0,
    med: 0,
    gear: 0,
    parts: 0,
    smuggle: 0
  });
  T.pts = (save, who) => Math.max(0, Math.round(+(save && save.loyal || {})[who] || 0));
  T.SIDE_SHOP = {
    vet: "gun",
    smuggle: "smuggle",
    med: "med"
  };
  T.sideUp = (who, side) => side && T.SIDE_SHOP[side] === who ? 1 : 0;
  T.lvAt = function(who, pts, side) {
    const N = T.NEED[who];
    let k = 0;
    if (N) for (let i = 1; i < N.length; i++) if (pts >= N[i]) k = i;
    if (N) k = Math.min(N.length - 1, k + T.sideUp(who, side));
    return T.LV[k];
  };
  T.level = (save, who) => T.NEED[who] ? T.lvAt(who, T.pts(save, who), save && save.story && save.story.side) : T.LV[0];
  T.need = (who, l, side) => (T.NEED[who] || [ 0 ])[l.n - 1 - T.sideUp(who, side)] || 0;
  T.nextOf = (who, l) => T.NEED[who] && T.LV[l.n] || null;
  T.SELL_WORD = {
    gun: "총 · 근접무기",
    ammo: "탄 · 탄창",
    med: "약",
    gear: "방어구 · 가방 · 리그",
    parts: "총 파츠",
    smuggle: "잡동사니 · 투척물 · 그 밖"
  };
  T.perks = function(who, l) {
    const L = [];
    if (l.disc) L.push("가끔 할인 −" + Math.round(l.disc * 100) + "%");
    if (l.sell) L.push("파는 값 +" + Math.round(l.sell * 100) + "%");
    if (l.slot && who !== "smuggle") L.push("좌판 +" + l.slot + "칸");
    if (l.rare) L.push(l.rare >= 1 ? "귀한 물건 늘" : "귀한 물건 가끔");
    {
      const nw = l.n > 1 && T.NEED[who] ? T.newAt(who, l.n).length : 0;
      if (nw) L.push("새 물건 " + nw + "가지");
    }
    return L;
  };
  T.buyPrice = (price, floor, d) => {
    const k = typeof d === "number" ? d : d && d.disc || 0;
    return k > 0 ? Math.max(200, floor || 0, Math.min(price, Math.round(price * (1 - k) / 100) * 100)) : price;
  };
  T.CURE = {
    name: "증상 억제약",
    val: 15e4,
    pct: 3,
    min: 2e5,
    step: 1e3
  };
  T.isCure = name => name === T.CURE.name;
  T.curePrice = function(w, who) {
    const C = T.CURE, W = Math.max(0, Math.round(+w || 0)), base = Math.max(C.min, Math.round(W * C.pct / (100 * C.step)) * C.step);
    return who === "smuggle" ? Math.round(base * (100 + (D && D.smuggleMarkup || 0)) / 1e4) * 100 : base;
  };
  for (const d of [ D && D.cure ].concat(...(D && D.stalls || []).map(s => (s.always || []).concat(s.pool || [])), (D && D.smuggle || []).map(s => s && s.item))) if (d && d.name === T.CURE.name) d.val = T.CURE.val;
  T.UNLOCK = {
    gun: {
      군용칼: 2,
      "인계철선 키트": 2,
      "사제 사냥총": 2,
      엽총: 3,
      "사제 기관단총": 4
    },
    ammo: {
      "9mm 할로포인트 탄창": 2,
      "5.56mm 할로포인트 탄창": 2,
      "7.62mm 할로포인트 탄창": 2,
      "12게이지 슬러그": 2,
      "7.62mm 탄약상자": 2,
      "9mm 철갑탄 탄창": 3,
      "5.56mm 철갑탄 탄창": 3,
      "12게이지 철갑탄": 3,
      "5.56mm 탄통 한 개": 3,
      "7.62mm 철갑탄 탄창": 4
    },
    med: {
      "아드레날린 주사": 2,
      "군용 응급 파우치": 3,
      "수술 키트": 3,
      "긴급 탈출 신호탄": 4
    },
    gear: {
      방탄조끼: 2,
      "플레이트 캐리어": 2,
      "전술 헬멧": 2,
      "방탄판 조끼": 3,
      "중형 방탄 헬멧": 3,
      "군용 방탄복": 4,
      "중전투 방탄복": 4
    },
    parts: {
      "홀로그램 사이트": 2,
      "전술 개머리판": 2,
      "레이저 사이트": 2,
      "대용량 탄창": 2,
      "권총 소음기": 3,
      "4배율 조준경": 3,
      "대용량 퀵드로우 탄창": 4,
      "소총 소음기": 4
    },
    smuggle: {
      "K2 소총": 2,
      "K7 소음기관단총": 2,
      "5.56mm 철갑탄 상자": 2,
      "USAS-12 산탄총": 3,
      "K2C1 소총": 3,
      "7.62mm 철갑탄 상자": 3,
      "K3 기관총": 4,
      "K14 저격소총": 4
    }
  };
  T.unlockAt = (who, name) => Math.max(1, (T.UNLOCK[who] || {})[name] | 0 || 1);
  T.isRare = (who, name) => (T.RARE[who] || []).some(r => r[0] === name);
  T.opens = (who, name, l, rare) => rare ? !!(l && l.rare) && T.isRare(who, name) : (l && l.n || 1) >= T.unlockAt(who, name);
  T.open = (save, who, name, rare) => T.opens(who, name, T.level(save, who), rare);
  T.canBuy = function(name, lvOf) {
    for (const w of T.WHO) {
      const c = T.catalog(w).get(name);
      if (!c) continue;
      const l = lvOf(w);
      if (c.k !== "rare" && T.opens(w, name, l) || T.opens(w, name, l, true)) return true;
    }
    return false;
  };
  T.newAt = (who, n) => [ ...T.catalog(who) ].filter(([nm, c]) => c.k !== "rare" && T.unlockAt(who, nm) === n).sort((a, b) => a[1].p - b[1].p).map(([nm]) => nm);
  T.oldNames = () => SX.OLD_NAMES && typeof SX.OLD_NAMES === "object" ? SX.OLD_NAMES : {};
  T.SALE_P = .25;
  T.saleOn = function(deal, who) {
    if (!deal || typeof deal !== "object" || deal.seed == null || !T.NEED[who]) return false;
    return rng((hash("sale:" + who) ^ (deal.seed | 0)) >>> 0)() < T.SALE_P;
  };
  T.saleOf = (deal, who, l) => l && l.disc && T.saleOn(deal, who) ? l.disc : 0;
  T.sellWho = function(it) {
    const k = it && it.kind;
    if (k === "gun" || k === "melee") return "gun";
    if (k === "mag" || k === "ammo") return "ammo";
    if (k === "heal" || k === "cure" || k === "flare") return "med";
    if (k === "armor" || k === "helmet" || k === "bag" || k === "rig" || k === "afix") return "gear";
    if (k === "part" || k === "partbox") return "parts";
    return "smuggle";
  };
  T.MAGS = {
    "9mm": "9mm 탄창",
    "5.56mm": "5.56mm 탄창",
    "7.62mm": "7.62mm 탄창",
    "12게이지": "12게이지 탄"
  };
  T.gives = d => d && d.kind === "ammo" ? d.one ? [ [ d.one, 1 ] ] : [ [ T.MAGS[d.cal], 3 ] ] : [ [ d && d.name, 1 ] ];
  T.SMUG_EXTRA = [ [ "수류탄", 45e3 ], [ "섬광탄", 4e4 ], [ "최루탄", 38e3 ], [ "연막탄", 34e3 ], [ "화염병", 3e4 ] ];
  T.RARE = {
    gun: [ [ "K13 소음권총", 38e4 ], [ "M16A1 소총", 26e4 ] ],
    ammo: [ [ "9mm 탄 상자", 14e4 ], [ "5.56mm 탄 상자", 38e4 ] ],
    med: [ [ "진통 주사기", 6e4 ], [ "소독약", 26e3 ] ],
    gear: [ [ "중전투 방탄복", 108e4 ], [ "중형 방탄 헬멧", 47e4 ] ],
    parts: [ [ "중급 파츠 상자", 4e5 ], [ "상급 파츠 상자", 7e5 ] ],
    smuggle: [ [ "7.62mm 탄 상자", 62e4 ], [ "12게이지 탄 상자", 36e4 ] ]
  };
  const catCache = {};
  T.catalog = function(who) {
    if (catCache[who]) return catCache[who];
    const out = new Map;
    if (who === "smuggle") {
      for (const sm of D.smuggle || []) if (sm && sm.item) out.set(sm.item.name, {
        p: Math.round(sm.base * (1 + (D.smuggleMarkup || 0) / 100) / 100) * 100,
        k: "always",
        d: sm.item
      });
      for (const [n, p] of T.SMUG_EXTRA) if (!out.has(n)) out.set(n, {
        p,
        k: "always",
        d: null
      });
    } else {
      const st = (D.stalls || []).find(s => s.id === who);
      if (st) {
        for (const d of st.always || []) out.set(d.name, {
          p: d.price,
          k: "always",
          d
        });
        for (const d of st.pool || []) if (!out.has(d.name)) out.set(d.name, {
          p: d.price,
          k: "pool",
          d
        });
      }
    }
    for (const [n, p] of T.RARE[who] || []) if (!out.has(n)) out.set(n, {
      p,
      k: "rare",
      d: null
    });
    return catCache[who] = out;
  };
  T.sellers = function(name) {
    const out = [];
    for (const w of T.WHO) {
      const c = T.catalog(w).get(name);
      if (c) out.push({
        who: w,
        k: c.k,
        p: c.p,
        at: c.k === "rare" ? 3 : T.unlockAt(w, name)
      });
    }
    return out;
  };
  T.BARTER = {
    gun: [ {
      id: "g1",
      give: [ [ "기름 라이터", 1 ], [ "자물쇠", 2 ], [ "경첩", 1 ] ],
      get: [ "장도리", 1 ]
    }, {
      id: "g2",
      give: [ [ "태블릿", 2 ], [ "기름 라이터", 1 ], [ "자물쇠", 1 ] ],
      get: [ "군용칼", 1 ]
    }, {
      id: "g3",
      give: [ [ "손목시계", 1 ], [ "열쇠 꾸러미", 2 ] ],
      get: [ ".38 리볼버", 1 ]
    }, {
      id: "g4",
      give: [ [ "태블릿", 1 ], [ "기름 라이터", 2 ], [ "청테이프", 2 ] ],
      get: [ "사제 산탄총", 1 ]
    }, {
      id: "g5",
      give: [ [ "손목시계", 1 ], [ "태블릿", 2 ] ],
      get: [ "K5 권총", 1 ]
    } ],
    ammo: [ {
      id: "a1",
      give: [ [ "담배 한 갑", 3 ], [ "라이터", 2 ], [ "성냥갑", 2 ] ],
      get: [ "9mm 탄창", 1 ]
    }, {
      id: "a2",
      give: [ [ "LED 손전등", 2 ], [ "담배 한 갑", 3 ], [ "건전지 낱개", 1 ] ],
      get: [ "12게이지 탄", 1 ]
    }, {
      id: "a3",
      give: [ [ "담배 한 갑", 4 ], [ "LED 손전등", 2 ] ],
      get: [ "5.56mm 탄창", 1 ]
    }, {
      id: "a4",
      give: [ [ "손목시계", 1 ], [ "담배 한 갑", 2 ] ],
      get: [ "7.62mm 탄창", 1 ]
    } ],
    med: [ {
      id: "m1",
      give: [ [ "담배 한 갑", 2 ], [ "칫솔", 4 ] ],
      get: [ "진통제", 1 ]
    }, {
      id: "m2",
      give: [ [ "정수 필터", 1 ], [ "나무젓가락 묶음", 4 ], [ "페인트 붓", 3 ] ],
      get: [ "지혈대", 1 ]
    }, {
      id: "m3",
      give: [ [ "태블릿", 2 ], [ "향수병", 2 ], [ "비누 한 장", 3 ] ],
      get: [ "구급킷", 1 ]
    }, {
      id: "m4",
      give: [ [ "산삼 뿌리", 1 ], [ "비누 한 장", 3 ] ],
      get: [ "항생제", 2 ]
    } ],
    gear: [ {
      id: "r1",
      give: [ [ "청테이프", 3 ], [ "낡은 운동화", 1 ] ],
      get: [ "작은 가방", 1 ]
    }, {
      id: "r2",
      give: [ [ "태블릿", 1 ], [ "청테이프", 2 ], [ "낡은 운동화", 4 ] ],
      get: [ "방검복", 1 ]
    }, {
      id: "r3",
      give: [ [ "태블릿", 1 ], [ "청테이프", 2 ], [ "트로피", 4 ] ],
      get: [ "경찰 방석모", 1 ]
    }, {
      id: "r4",
      give: [ [ "손목시계", 1 ], [ "청테이프", 2 ] ],
      get: [ "소프트 방탄조끼", 1 ]
    }, {
      id: "r5",
      give: [ [ "태블릿", 2 ], [ "청테이프", 1 ] ],
      get: [ "전술 조끼", 1 ]
    } ],
    parts: [ {
      id: "p1",
      give: [ [ "태블릿", 1 ], [ "청테이프", 2 ], [ "마우스", 5 ] ],
      get: [ "스피드로더", 1 ]
    }, {
      id: "p2",
      give: [ [ "노트북", 1 ], [ "보조배터리", 1 ], [ "건전지 낱개", 3 ] ],
      get: [ "레드닷 사이트", 1 ]
    }, {
      id: "p3",
      give: [ [ "노트북", 1 ], [ "태블릿", 1 ], [ "리모컨", 4 ] ],
      get: [ "수직 손잡이", 1 ]
    }, {
      id: "p4",
      give: [ [ "손목시계", 1 ], [ "건전지 낱개", 3 ] ],
      get: [ "소염기", 1 ]
    }, {
      id: "p5",
      give: [ [ "노트북", 2 ] ],
      get: [ "퀵드로우 탄창", 1 ]
    } ],
    smuggle: [ {
      id: "s1",
      give: [ [ "담배 한 갑", 4 ], [ "화투 한 목", 5 ] ],
      get: [ "수류탄", 1 ]
    }, {
      id: "s2",
      give: [ [ "기밀 서류", 1 ], [ "만년필", 2 ] ],
      get: [ "섬광탄", 1 ]
    }, {
      id: "s3",
      give: [ [ "손목시계", 1 ], [ "향수병", 4 ] ],
      get: [ "연막탄", 2 ]
    }, {
      id: "s4",
      give: [ [ "금두꺼비", 1 ], [ "금목걸이", 2 ] ],
      get: [ "M16A1 소총", 1 ]
    }, {
      id: "s5",
      give: [ [ "담배 한 갑", 3 ], [ "만년필", 2 ] ],
      get: [ "최루탄", 1 ]
    } ]
  };
  function hash(str) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h;
  }
  function rng(seed) {
    let a = seed >>> 0;
    return function() {
      a |= 0;
      a = a + 1831565813 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  T.newSeed = () => Math.random() * 2147483647 | 0;
  T.offer = function(deal, who) {
    const pool = T.BARTER[who];
    if (!pool || !deal || typeof deal !== "object" || deal.seed == null) return [];
    const r = rng((hash(who) ^ (deal.seed | 0)) >>> 0), L = pool.slice();
    for (let i = L.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      const t = L[i];
      L[i] = L[j];
      L[j] = t;
    }
    return L.slice(0, 1 + (r() < .5 ? 1 : 0));
  };
  T.bartKey = (who, deal) => who + ":" + deal.id;
  T.bartUsed = (day, who, deal) => !!(day && day.done && day.done[T.bartKey(who, deal)]);
  T.bartPrice = (who, deal) => {
    const c = T.catalog(who).get(deal.get[0]);
    return c ? c.p * deal.get[1] : 0;
  };
  T.barter = function(data, who, dealId, h) {
    const st = data && data.deal;
    if (!st || typeof st !== "object") return {
      ok: false,
      msg: "좌판을 다시 열어 주십시오"
    };
    const deal = T.offer(st, who).find(q => q.id === dealId);
    if (!deal) return {
      ok: false,
      msg: "지금은 그 교환을 받지 않습니다 — 좌판에 새 물건이 들어오면 바뀝니다"
    };
    if (T.bartUsed(st, who, deal)) return {
      ok: false,
      msg: "이번 좌판에서는 이미 바꿨습니다 — 새 물건이 들어오면 다시 됩니다"
    };
    const lack = deal.give.filter(([n, c]) => h.count(n) < c).map(([n, c]) => n + " " + (c - h.count(n)));
    if (lack.length) return {
      ok: false,
      msg: "모자랍니다 — " + lack.join(", ")
    };
    const outs = [];
    for (let i = 0; i < deal.get[1]; i++) outs.push(deal.get[0]);
    const back = T.keepAll(data);
    for (const [n, c] of deal.give) for (let i = 0; i < c; i++) if (!h.take(n)) {
      back();
      return {
        ok: false,
        msg: n + " 이(가) 모자랍니다"
      };
    }
    if (h.room && !h.room(outs)) {
      back();
      return {
        ok: false,
        msg: "보관함에 자리가 없습니다"
      };
    }
    for (const n of outs) h.give(n);
    st.done = st.done && typeof st.done === "object" ? st.done : {};
    st.done[T.bartKey(who, deal)] = 1;
    return {
      ok: true,
      msg: "🔁 " + T.NAME[who] + " — " + deal.get[0] + (deal.get[1] > 1 ? " " + deal.get[1] + "개" : "") + " 받았습니다(물물교환)",
      worth: T.bartPrice(who, deal),
      deal
    };
  };
  T.keepAll = data => {
    const k = data && data.kit, L = [ data && data.stash ].concat(k ? [ "rig", "bag" ].map(s => k[s] && k[s].grid) : []).filter(g => g && Array.isArray(g.list)).map(g => [ g, g.list.slice() ]);
    return () => {
      for (const [g, l] of L) g.list = l;
    };
  };
  T.KEY_FEE = .1;
  T.KEY_STEP = 1e3;
  T.KEY_WHO = "smuggle";
  const KEY_W = function() {
    const by = new Map, DD = D || {};
    const add = d => {
      if (!d || typeof d !== "object" || !d.name) return;
      const v = Math.max(0, Math.round(d.val || 0)), o = by.get(d.name);
      if (!o || v > o.val) by.set(d.name, {
        val: v,
        kind: d.kind || "junk"
      });
    };
    for (const L of [ DD.items, DD.specials, DD.guns, DD.mags, DD.melee, DD.containers, DD.shop, DD.parts ]) if (Array.isArray(L)) for (const d of L) add(d);
    for (const st of DD.stalls || []) for (const d of (st.pool || []).concat(st.always || [])) add(d);
    for (const s of DD.smuggle || []) add(s && s.item);
    for (const one of [ DD.defBag, DD.helmet, DD.cure, DD.flare ]) add(one);
    add({
      name: "수류탄",
      kind: "grenade",
      val: 38e3
    });
    const sell = n => {
      const d = by.get(n);
      if (!d) return 0;
      const f = d.kind === "gun" ? .94 : d.kind === "armor" || d.kind === "helmet" ? .95125 : 1;
      return d.val * .75 * f;
    };
    const out = {};
    for (const k of SX.KEY_ROOMS || []) {
      if (!k || !k.key) continue;
      const n = Math.max(0, k.n | 0), must = (Array.isArray(k.must) ? k.must : []).slice(0, n), pool = Array.isArray(k.pool) ? k.pool : [];
      const rest = Math.max(0, Math.min(pool.length, n - must.length)), mean = pool.length ? pool.reduce((t, x) => t + sell(x), 0) / pool.length : 0;
      const uses = Math.max(1, k.uses | 0);
      let per = must.reduce((t, x) => t + sell(x), 0) + rest * mean, how = "loot";
      if (!(per > 0)) {
        per = Math.max(0, +k.val || 0) * .75 / uses;
        how = "val";
      }
      out[k.key] = {
        key: k.key,
        b: k.b,
        room: k.room,
        uses,
        per,
        full: per * uses,
        by: how
      };
    }
    return out;
  }();
  const kWon = n => "₩" + Math.round(n).toLocaleString("ko-KR");
  T.keyInfo = name => KEY_W[String(name || "")] || null;
  T.keyNames = () => Object.keys(KEY_W);
  T.keyLeft = it => {
    const k = it && T.keyInfo(it.name);
    if (!k) return 0;
    const mx = Math.max(1, +it.usesMax || k.uses);
    return Math.max(0, Math.min(mx, it.uses == null ? mx : Math.floor(+it.uses) || 0));
  };
  T.keyWorth = (name, left) => {
    const k = T.keyInfo(name);
    if (!k) return 0;
    const n = left == null ? k.uses : Math.max(0, Math.min(k.uses, Math.floor(+left) || 0));
    return k.per * n;
  };
  T.keyPay = function(give, left, get) {
    const a = T.keyInfo(give), b = T.keyInfo(get);
    if (!a || !b || a.key === b.key) return null;
    const wGet = T.keyWorth(get), wGive = T.keyWorth(give, left), diff = Math.max(0, wGet - wGive), fee = wGet * T.KEY_FEE;
    const st = Math.max(1, T.KEY_STEP | 0), pay = Math.ceil(Math.round(diff + fee) / st) * st;
    return {
      pay,
      get: wGet,
      give: wGive,
      fee,
      diff
    };
  };
  const keyGrids = data => {
    const out = [], k = data && data.kit, s = data && data.safe, push = g => {
      if (g && Array.isArray(g.list) && out.indexOf(g) < 0) out.push(g);
    };
    push(data && data.stash);
    if (k) for (const sl of [ "rig", "bag" ]) push(k[sl] && k[sl].grid);
    if (s && typeof s === "object") {
      push(s.grid);
      if (Array.isArray(s.ext)) for (const e of s.ext.slice(0, 12)) push(e && e.grid);
    }
    return out;
  };
  T.keyOwned = function(data) {
    const m = new Map;
    for (const g of keyGrids(data)) for (const e of g.list) {
      const it = e && e.it;
      if (!it || !T.keyInfo(it.name)) continue;
      const left = T.keyLeft(it), id = it.name + "|" + left, o = m.get(id);
      if (o) o.n++; else m.set(id, {
        name: it.name,
        left,
        max: T.keyInfo(it.name).uses,
        n: 1
      });
    }
    const ord = T.keyNames();
    return [ ...m.values() ].sort((x, y) => ord.indexOf(x.name) - ord.indexOf(y.name) || y.left - x.left);
  };
  const findKey = (data, name, left) => {
    for (const g of keyGrids(data)) for (const e of g.list) {
      const it = e && e.it;
      if (it && it.name === name && (left == null || T.keyLeft(it) === left)) return {
        g,
        e
      };
    }
    return null;
  };
  T.keySwap = function(data, give, left, get, h) {
    if (!data || typeof data !== "object" || !h || typeof h.give !== "function") return {
      ok: false,
      msg: "좌판을 다시 열어 주십시오"
    };
    give = String(give || "");
    get = String(get || "");
    if (!T.keyInfo(give) || !T.keyInfo(get)) return {
      ok: false,
      msg: "바꿀 수 없는 열쇠입니다"
    };
    if (give === get) return {
      ok: false,
      msg: "같은 열쇠끼리는 바꾸지 않습니다"
    };
    const f = findKey(data, give, left == null ? null : Math.floor(+left) || 0);
    if (!f) return {
      ok: false,
      msg: "그 열쇠를 갖고 있지 않습니다"
    };
    const c = T.keyPay(give, T.keyLeft(f.e.it), get), money = Math.max(0, Math.round(+data.money || 0));
    if (money < c.pay) return {
      ok: false,
      msg: "돈이 모자랍니다 — " + kWon(c.pay - money)
    };
    const L = f.g.list, i = L.indexOf(f.e);
    L.splice(i, 1);
    if (!h.give(get)) {
      L.splice(i, 0, f.e);
      return {
        ok: false,
        msg: "보관함에 자리가 없습니다"
      };
    }
    data.money = money - c.pay;
    return {
      ok: true,
      msg: "🔑 밀수꾼 — " + give + " → " + get + " · " + kWon(c.pay) + " 냈습니다",
      pay: c.pay
    };
  };
  T.WISH_MAX = 20;
  T.wishOf = save => save && Array.isArray(save.wish) ? save.wish : [];
  T.wished = (save, name) => T.wishOf(save).indexOf(name) >= 0;
  T.wishable = name => T.sellers(name).length > 0;
})(window.SX);
