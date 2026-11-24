(function(SX) {
  "use strict";
  const F = SX.feats = {};
  const bs = () => SX.data.buildings.filter(b => !b.final && !b.train);
  const R = s => s.rec || (s.rec = {
    b: {},
    how: {},
    kZ: 0,
    kS: 0,
    kB: 0,
    bossB: {},
    night: 0,
    best: 0,
    streak: 0,
    bestStreak: 0
  });
  const bodyMin = s => {
    const b = s.body || {};
    return Math.min(b.st || 0, b.str || 0, b.run || 0);
  };
  const bodyMax = s => {
    const b = s.body || {};
    return Math.max(b.st || 0, b.str || 0, b.run || 0);
  };
  const cnt = o => Object.keys(o || {}).length;
  const homeN = () => SX.home && SX.home.TIERS ? SX.home.TIERS.length : 10;
  F.LIST = [ [ "run1", "첫 출격", "처음으로 판에 들어갑니다", s => [ s.runs, 1 ] ], [ "run100", "출근 도장", "판에 100번 들어갑니다", s => [ s.runs, 100 ] ], [ "run500", "서울 개근상", "판에 500번 들어갑니다", s => [ s.runs, 500 ] ], [ "ext1", "살아 돌아온 자", "처음으로 탈출합니다", s => [ s.extracts, 1 ] ], [ "ext10", "생존자", "탈출 10번", s => [ s.extracts, 10 ] ], [ "ext50", "베테랑", "탈출 50번", s => [ s.extracts, 50 ] ], [ "ext200", "서울의 망령", "탈출 200번", s => [ s.extracts, 200 ] ], [ "ext500", "살아 있는 전설", "탈출 500번", s => [ s.extracts, 500 ] ], [ "ext1000", "끝까지 남은 사람", "탈출 1000번", s => [ s.extracts, 1e3 ] ], [ "streak5", "무사고", "의식을 잃지 않고 연달아 5번 탈출", s => [ R(s).bestStreak, 5 ] ], [ "streak15", "불사신", "의식을 잃지 않고 연달아 15번 탈출", s => [ R(s).bestStreak, 15 ] ], [ "streak30", "죽음을 비껴간 자", "의식을 잃지 않고 연달아 30번 탈출", s => [ R(s).bestStreak, 30 ] ], [ "dead10", "칠전팔기", "의식을 잃고도 10번 다시 일어납니다", s => [ Object.values(R(s).b).reduce((n, b) => n + ((b && b.dead) | 0), 0), 10 ] ], [ "kz100", "방역반", "감염체 100마리 처치", s => [ R(s).kZ, 100 ] ], [ "kz1000", "청소부", "감염체 1000마리 처치", s => [ R(s).kZ, 1e3 ] ], [ "kz5000", "역병 사냥꾼", "감염체 5000마리 처치", s => [ R(s).kZ, 5e3 ] ], [ "kz10000", "감염체의 천적", "감염체 1만 마리 처치", s => [ R(s).kZ, 1e4 ] ], [ "ks50", "사냥꾼", "약탈자 50명 처치", s => [ R(s).kS, 50 ] ], [ "ks300", "약탈자의 악몽", "약탈자 300명 처치", s => [ R(s).kS, 300 ] ], [ "ks1000", "무법 지대의 보안관", "약탈자 1000명 처치", s => [ R(s).kS, 1e3 ] ], [ "boss1", "두목 사냥", "옥상 두목을 처음 쓰러뜨립니다", s => [ R(s).kB, 1 ] ], [ "boss10", "옥상 단골", "옥상 두목을 10번 쓰러뜨립니다", s => [ R(s).kB, 10 ] ], [ "boss50", "두목들의 악몽", "옥상 두목을 50번 쓰러뜨립니다", s => [ R(s).kB, 50 ] ], [ "bossAll", "옥상의 주인", "모든 건물의 두목을 쓰러뜨립니다", s => [ cnt(R(s).bossB), bs().filter(b => !b.noBoss).length ] ], [ "allB", "서울 도보 여행", "모든 건물에서 한 번씩 탈출", s => [ Object.values(R(s).b).filter(b => b.ext > 0).length, bs().length ] ], [ "allB10", "서울 지리 박사", "모든 건물에서 10번씩 탈출", s => [ bs().filter(b => ((R(s).b[b.id] || {}).ext | 0) >= 10).length, bs().length ] ], [ "allHow", "출구 전문가", "집라인 · 출입문 · 신호탄 · 완강기로 모두 탈출", s => [ [ "zip", "door", "flare", "escape" ].filter(h => R(s).how[h]).length, 4 ] ], [ "night10", "올빼미", "밤에 10번 탈출", s => [ R(s).night, 10 ] ], [ "night50", "어둠 속의 그림자", "밤에 50번 탈출", s => [ R(s).night, 50 ] ], [ "night200", "밤의 주인", "밤에 200번 탈출", s => [ R(s).night, 200 ] ], [ "haul1m", "한탕", "한 판에 100만 원 넘게 챙겨 나옵니다", s => [ Math.min(R(s).best, 1e6), 1e6 ] ], [ "haul5m", "대박", "한 판에 500만 원 넘게 챙겨 나옵니다", s => [ Math.min(R(s).best, 5e6), 5e6 ] ], [ "haul10m", "잭팟", "한 판에 1000만 원 넘게 챙겨 나옵니다", s => [ Math.min(R(s).best, 1e7), 1e7 ] ], [ "haul30m", "인생 역전", "한 판에 3000만 원 넘게 챙겨 나옵니다", s => [ Math.min(R(s).best, 3e7), 3e7 ] ], [ "rich10m", "알뜰 살림", "돈 1000만 원을 모읍니다", s => [ Math.min(s.money, 1e7), 1e7 ] ], [ "rich", "건물주", "돈 1억 원을 모읍니다", s => [ Math.min(s.money, 1e8), 1e8 ] ], [ "rich500m", "재벌", "돈 5억 원을 모읍니다", s => [ Math.min(s.money, 5e8), 5e8 ] ], [ "rich1b", "서울의 큰손", "돈 10억 원을 모읍니다", s => [ Math.min(s.money, 1e9), 1e9 ] ], [ "homeAll", "부동산 부자", "모든 집을 가집니다", s => [ new Set((s.home && s.home.owned || []).map(n => n | 0).filter(n => n >= 0 && n < homeN())).size, homeN() ] ], [ "gym1", "운동 시작", "헬스장 운동 하나를 1단계까지", s => [ Math.min(bodyMax(s), 1), 1 ] ], [ "gym3", "땀방울", "체력·근력·지구력 모두 3단계", s => [ Math.min(bodyMin(s), 3), 3 ] ], [ "gymAll", "강철 몸", "체력·근력·지구력 모두 5단계", s => [ Math.min(bodyMin(s), 5), 5 ] ], [ "hit5", "돌주먹", "샌드백(타격) 5단계", s => [ Math.min(+(s.body || {}).hit || 0, 5), 5 ] ], [ "fight10", "장터의 주먹", "주먹 싸움 10번 이깁니다", s => [ s.fights && s.fights.wins || 0, 10 ] ], [ "fight30", "장터의 챔피언", "주먹 싸움 30번 이깁니다", s => [ s.fights && s.fights.wins || 0, 30 ] ], [ "fight100", "장터의 왕", "주먹 싸움 100번 이깁니다", s => [ s.fights && s.fights.wins || 0, 100 ] ], [ "quest5", "해결사", "상인 의뢰 5개를 끝냅니다", s => [ (s.quests && s.quests.done || []).length, 5 ] ], [ "quest10", "믿을 만한 사람", "상인 의뢰 10개를 끝냅니다", s => [ (s.quests && s.quests.done || []).length, 10 ] ], [ "quest20", "상인들의 은인", "상인 의뢰 20개를 끝냅니다", s => [ (s.quests && s.quests.done || []).length, 20 ] ], [ "found40", "수집가", "물건 40가지를 챙겨 나옵니다(도감)", s => [ (R(s).found || []).length, 40 ] ], [ "found100", "고물상", "물건 100가지를 챙겨 나옵니다(도감)", s => [ (R(s).found || []).length, 100 ] ], [ "found200", "만물상", "물건 200가지를 챙겨 나옵니다(도감)", s => [ (R(s).found || []).length, 200 ] ], [ "fish1", "첫 입질", "물고기를 처음 낚습니다", s => [ s.fish && s.fish.n || 0, 1 ] ], [ "fish30", "강태공", "물고기 30마리를 낚습니다", s => [ s.fish && s.fish.n || 0, 30 ] ], [ "fish200", "한강의 어부", "물고기 200마리를 낚습니다", s => [ s.fish && s.fish.n || 0, 200 ] ], [ "fishKg4", "월척", "4kg 넘는 물고기를 낚습니다", s => [ (s.fish && s.fish.kg) >= 4 ? 1 : 0, 1 ] ], [ "named1", "이름난 사냥꾼", "건물 전용 두목을 처음 쓰러뜨립니다", s => [ cnt(R(s).namedB), 1 ] ], [ "namedAll", "서울의 해결사", "건물 일곱 곳의 전용 두목을 모두 쓰러뜨립니다", s => [ cnt(R(s).namedB), 7 ] ], [ "eggAll", "숨은 이야기 수집가", "도시 곳곳에 숨겨진 것을 모두 찾았습니다", s => [ (s.eggs || []).length, (SX.EGGS || []).length || 9 ], {
    hidden: true
  } ], [ "seoul", "서울을 떠난 사람", "여의도 헬기장에서 헬기를 타고 서울을 떠납니다", s => [ R(s).how.heli || 0, 1 ] ], [ "ng2", "다시 서울로", "헬기로 떠난 뒤 다시 처음부터 시작해 2회차를 엽니다", s => [ (s.ng | 0) + 1, 2 ] ], [ "ng5", "끝나지 않는 탈출", "5회차를 엽니다", s => [ (s.ng | 0) + 1, 5 ] ], [ "ng10", "서울에 갇힌 사람", "10회차를 엽니다", s => [ (s.ng | 0) + 1, 10 ] ], [ "ends3", "", "", s => [ [ "vet", "smuggle", "med" ].filter(k => Array.isArray(s.ends) && s.ends.indexOf(k) >= 0).length, 3 ] ] ];
  F.byId = id => F.LIST.find(f => f[0] === id);
  const stale = (s, id) => id === "homeAll" && ((s.rec && s.rec.homeN) | 0) < homeN();
  F.done = (s, f) => {
    if (s && s.rec && Array.isArray(s.rec.seen) && s.rec.seen.includes(f[0]) && !stale(s, f[0])) return true;
    const [a, b] = f[3](s);
    return a >= b;
  };
  F.check = function(s, quiet) {
    const r = R(s), seen = r.seen || (r.seen = []), fresh = [];
    const first = !r.inited;
    r.inited = 1;
    {
      const i = seen.indexOf("homeAll");
      if (i >= 0 && stale(s, "homeAll")) seen.splice(i, 1);
    }
    for (const f of F.LIST) {
      if (seen.includes(f[0]) || !F.done(s, f)) continue;
      seen.push(f[0]);
      if (f[0] === "homeAll") r.homeN = homeN();
      fresh.push(f);
    }
    if (!quiet && !first) for (const f of fresh) {
      SX.log("🏅 도전 과제 「" + f[1] + "」 — " + f[2], "good");
      SX.audio && SX.audio.play("buy");
    }
    return first ? [] : fresh;
  };
  F.raidEnd = function(s, o) {
    const r = R(s), bid = o.b || "?";
    const b = r.b[bid] || (r.b[bid] = {
      runs: 0,
      ext: 0,
      dead: 0,
      best: 0,
      kills: 0
    });
    b.runs++;
    b.kills += o.kills || 0;
    r.kZ += o.kZ || 0;
    r.kS += o.kS || 0;
    r.kB += o.kB || 0;
    if (o.kB) r.bossB[bid] = (r.bossB[bid] || 0) + o.kB;
    if (o.kN) {
      r.namedB = r.namedB || {};
      r.namedB[bid] = (r.namedB[bid] || 0) + o.kN;
    }
    if (o.win) {
      b.ext++;
      r.streak = (r.streak || 0) + 1;
      r.bestStreak = Math.max(r.bestStreak || 0, r.streak);
      if (o.how) r.how[o.how] = (r.how[o.how] || 0) + 1;
      if (o.tod === "night") r.night++;
      const g = Math.max(0, Math.round(o.gained || 0));
      b.best = Math.max(b.best, g);
      r.best = Math.max(r.best, g);
      const fd = r.found || (r.found = []);
      for (const n of o.picked || []) if (typeof n === "string" && !fd.includes(n)) fd.push(n);
    } else {
      b.dead++;
      r.streak = 0;
    }
    return F.check(s, o.quiet);
  };
  F.LIVE = [ "kz100", "kz1000", "kz5000", "kz10000", "ks50", "ks300", "ks1000", "boss1", "boss10", "boss50", "bossAll", "named1", "namedAll" ];
  let liveId = null, liveSaid = [];
  F.live = function(s, o) {
    if (!s || !o || !o.b || o.b === "train") return [];
    if (liveId !== o.id) {
      liveId = o.id;
      liveSaid = [];
    }
    const r = R(s), seen = r.seen || [], plus = (m, n) => {
      const c = Object.assign({}, m || {});
      if (n > 0) c[o.b] = (c[o.b] || 0) + n;
      return c;
    };
    const vs = Object.create(s);
    vs.rec = Object.assign({}, r, {
      kZ: (r.kZ | 0) + (o.kZ | 0),
      kS: (r.kS | 0) + (o.kS | 0),
      kB: (r.kB | 0) + (o.kB | 0),
      bossB: plus(r.bossB, o.kB | 0),
      namedB: plus(r.namedB, o.kN | 0)
    });
    const out = [];
    for (const id of F.LIVE) {
      if (seen.includes(id) || liveSaid.includes(id)) continue;
      const f = F.byId(id);
      if (!f || F.done(s, f)) continue;
      const [a, b] = f[3](vs);
      if (a < b) continue;
      liveSaid.push(id);
      out.push(f);
      SX.log("🏅 도전 과제 「" + f[1] + "」 — " + f[2] + " · 판이 끝나면 셉니다", "good");
      SX.audio && SX.audio.play("buy");
    }
    return out;
  };
  F.FOE_NAME = {
    zombie: "감염체",
    dog: "감염된 들개",
    brute: "덩치 감염체",
    hazmat: "방호복 감염체",
    scav: "약탈자",
    sniper: "저격수",
    wksol: "군 잔당",
    boss: "약탈자 두목"
  };
  F.foeKey = e => e.named ? "n:" + e.named : e.boss ? "boss" : e.wkGuard ? "wksol" : F.FOE_NAME[e.variant] ? e.variant : e.type === "zombie" ? "zombie" : "scav";
  F.foeList = function() {
    const out = Object.keys(F.FOE_NAME).map(k => ({
      k,
      name: F.FOE_NAME[k]
    })), NB = SX.NAMED_BOSSES || {};
    for (const b of bs()) {
      const d = NB[b.id];
      if (d && !b.noBoss) out.push({
        k: "n:" + d.id,
        name: d.name,
        b: b.id
      });
    }
    return out;
  };
  const foeOld = (r, k) => k === "zombie" ? (r.kZ | 0) > 0 : k === "scav" ? (r.kS | 0) > 0 : k === "boss" ? (r.kB | 0) > 0 : k.startsWith("n:") ? Object.keys(r.namedB || {}).some(b => (r.namedB[b] | 0) > 0 && ((SX.NAMED_BOSSES || {})[b] || {}).id === k.slice(2)) : false;
  F.foeSeen = (s, k) => !!(s && s.rec && (Array.isArray(s.rec.foe) && s.rec.foe.indexOf(k) >= 0 || foeOld(s.rec, k)));
  F.foe = function(s, e) {
    if (!s || !e) return false;
    const k = F.foeKey(e), r = R(s), old = F.foeSeen(s, k), L = Array.isArray(r.foe) ? r.foe : r.foe = [];
    if (L.indexOf(k) >= 0 || L.length >= 64) return false;
    L.push(k);
    if (old) return false;
    SX.log("📖 새로 본 적 — " + (k.startsWith("n:") ? e.name || k : F.FOE_NAME[k]), "good");
    return true;
  };
  F.titles = s => F.LIST.filter(f => F.done(s, f)).map(f => f[1]).concat(F.wkTitles(s));
  F.wkTitles = s => s && Array.isArray(s.wt) ? s.wt.filter(t => typeof t === "string").slice(0, 20) : [];
  F.title = s => s && s.title && F.titles(s).includes(s.title) ? s.title : "";
  F.setTitle = (s, t) => {
    if (t && !F.titles(s).includes(t)) return false;
    s.title = t || "";
    return true;
  };
})(window.SX);
