"use strict";

(function(root) {
  const P = {};
  P.REAL_EXIT = {
    zip: 1,
    escape: 1,
    heli: 1,
    bridge: 1,
    tunnel: 1,
    site: 1,
    park: 1
  };
  P.realExit = raid => !!(raid && raid.win && P.REAL_EXIT[raid.via]);
  P.MODE_SLOT = 30 * 6e4;
  P.MODE_B = {
    office: 1,
    mall: 1,
    hos: 1,
    school: 1,
    metro: 1,
    base: 1
  };
  P.MODE_ON = {
    fire: 1,
    flood: 1,
    nos: 1,
    noz: 1
  };
  P.modeSlot = ms => Math.floor((ms + 9 * 36e5) / P.MODE_SLOT);
  P.modeRaw = (bid, slot) => {
    if (!P.MODE_B[bid]) return "normal";
    const s = bid + "|" + slot;
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    h ^= h >>> 16;
    h = Math.imul(h, 2246822507) >>> 0;
    h ^= h >>> 13;
    h = Math.imul(h, 3266489909) >>> 0;
    h ^= h >>> 16;
    const r = (h >>> 0) / 4294967296;
    return r < .22 ? "fire" : r < .37 ? "flood" : "normal";
  };
  P.modeOf = raw => P.MODE_ON[raw] ? raw : "normal";
  P.SP_B = [ "villa", "office", "mall", "hos", "school", "metro", "base", "bridge", "tunnel", "site" ];
  P.SP_P = .6;
  P.SP_NAME = {
    nos: "약탈자 없음",
    noz: "좀비 없음"
  };
  P.spForce = null;
  function spH(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    h ^= h >>> 16;
    h = Math.imul(h, 2246822507) >>> 0;
    h ^= h >>> 13;
    h = Math.imul(h, 3266489909) >>> 0;
    h ^= h >>> 16;
    return h >>> 0;
  }
  P.spSlot = ms => Math.floor((ms + 9 * 36e5) / P.TOD_SPAN);
  P.spAt = ms => {
    const k = P.spSlot(ms), f = P.spForce;
    if (typeof f === "string") {
      if (f === "off") return null;
      const m = /^(\w+):(nos|noz)$/.exec(f);
      if (m && P.SP_B.indexOf(m[1]) >= 0) return {
        k,
        b: m[1],
        m: m[2]
      };
    }
    if (spH("spo|" + k) / 4294967296 >= P.SP_P) return null;
    const t0 = k * P.TOD_SPAN - 9 * 36e5, ms0 = P.modeSlot(t0), cand = P.SP_B.filter(x => P.modeOf(P.modeRaw(x, ms0)) === "normal");
    if (!cand.length) return null;
    const b = cand[spH("spb|" + k) % cand.length];
    let m = spH("spm|" + k) / 4294967296 < .5 ? "nos" : "noz";
    const w = P.weekAt ? P.weekAt(t0) : null;
    if (w && w.b === b) {
      if (w.st === "horde") m = "nos"; else if (w.st === "lock") m = "noz";
    }
    return {
      k,
      b,
      m
    };
  };
  P.raidMode = (bid, ms) => {
    const m = P.modeOf(P.modeRaw(bid, P.modeSlot(ms)));
    if (m !== "normal") return m;
    const s = P.spAt(ms);
    return s && s.b === bid ? s.m : "normal";
  };
  P.modeLeft = (bid, ms) => {
    const T = P.TOD_SPAN, s = P.spSlot(ms), at = j => j * T - 9 * 36e5, cur = P.raidMode(bid, ms);
    let k = 1;
    while (k < 96 && P.raidMode(bid, at(s + k)) === cur) k++;
    return at(s + k) - ms;
  };
  P.modeOk = (bid, mode, ms) => {
    const s = P.modeSlot(ms);
    return mode === P.modeOf(P.modeRaw(bid, s)) || mode === P.modeOf(P.modeRaw(bid, s - 1)) || mode === P.raidMode(bid, ms) || mode === P.raidMode(bid, ms - P.TOD_SPAN);
  };
  P.modeFix = (bid, mode, ms) => typeof mode === "string" && P.modeOk(bid, mode, ms) ? mode : P.raidMode(bid, ms);
  P.TOD_SPAN = 15 * 6e4;
  P.TOD_GRACE = 2 * 6e4;
  P.todSpan = () => P.TOD_SPAN;
  const todSp = span => +span > 0 ? +span : P.TOD_SPAN;
  P.todPos = (ms, span) => {
    const c = 2 * todSp(span);
    return (((+ms || 0) + 9 * 36e5) % c + c) % c;
  };
  P.todAt = (ms, span) => P.todPos(ms, span) < todSp(span) ? "day" : "night";
  P.todLeft = (ms, span) => {
    const n = todSp(span), t = P.todPos(ms, span);
    return t < n ? n - t : 2 * n - t;
  };
  P.todFix = (tod, ms, span) => (tod === "day" || tod === "night") && (tod === P.todAt(ms, span) || tod === P.todAt(ms - P.TOD_GRACE, span)) ? tod : P.todAt(ms, span);
  P.WEEK_B = [ "office", "mall", "hos", "school", "metro", "base" ];
  P.WEEK_ST = [ "lock", "horde", "trove" ];
  P.WEEK_NAME = {
    lock: "봉쇄",
    horde: "대량 감염",
    trove: "보물"
  };
  P.WEEK_ZM = 1.5;
  P.WEEK_SPECIAL = .05;
  P.WEEK_LOOT = .25;
  P.WEEK_GUARDS = [ 3, 4 ];
  P.WEEK_CRATES = [ 2, 3 ];
  P.WEEK_VAULT_T = 10;
  P.WEEK_SEE = 6;
  P.WEEK_ALLOW = {
    lock: 9e6,
    horde: .35,
    trove: 9e6
  };
  P.WEEK_KILL = {
    lock: 1.1,
    horde: 1.8,
    trove: 1
  };
  P.WEEK_TASK = {
    lock: {
      n: 3,
      money: 3e6,
      name: "봉쇄 돌파"
    },
    horde: {
      n: 40,
      money: 3e6,
      name: "감염 소탕"
    },
    trove: {
      n: 1,
      money: 35e5,
      name: "보물 사냥"
    }
  };
  const WK0 = 2940, wkMemo = [];
  function wkHash(k) {
    const s = "wk|" + k;
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    h ^= h >>> 16;
    h = Math.imul(h, 2246822507) >>> 0;
    h ^= h >>> 13;
    h = Math.imul(h, 3266489909) >>> 0;
    h ^= h >>> 16;
    return h >>> 0;
  }
  function wkRaw(k, prev) {
    const h = wkHash(k), bs = prev ? P.WEEK_B.filter(b => b !== prev.b) : P.WEEK_B, ss = prev ? P.WEEK_ST.filter(s => s !== prev.st) : P.WEEK_ST;
    return {
      k,
      b: bs[h % bs.length],
      st: ss[(h >>> 12) % ss.length]
    };
  }
  function wkOf(k) {
    if (!(k >= WK0 && k < WK0 + 2e4)) return wkRaw(k, null);
    if (!wkMemo.length) wkMemo.push(wkRaw(WK0, null));
    while (wkMemo.length <= k - WK0) wkMemo.push(wkRaw(WK0 + wkMemo.length, wkMemo[wkMemo.length - 1]));
    return wkMemo[k - WK0];
  }
  P.wkForce = null;
  function wkForced(k) {
    const f = P.wkForce;
    if (typeof f !== "string") return null;
    if (f === "off") return {
      k,
      b: "",
      st: ""
    };
    const m = /^(\w+):(\w+)$/.exec(f);
    if (!m || P.WEEK_B.indexOf(m[1]) < 0 || P.WEEK_ST.indexOf(m[2]) < 0) return null;
    return {
      k,
      b: m[1],
      st: m[2]
    };
  }
  P.weekNo = ms => Math.floor((Math.floor((ms + 9 * 36e5) / 864e5) + 3) / 7);
  P.weekOf = k => wkForced(k | 0) || Object.assign({}, wkOf(k | 0));
  P.weekAt = ms => P.weekOf(P.weekNo(ms));
  P.weekStart = k => (k * 7 - 3) * 864e5 - 9 * 36e5;
  P.weekLeft = ms => P.weekStart(P.weekNo(ms) + 1) - ms;
  P.weekName = b => P.B_NAMES && P.B_NAMES[b] || b;
  function wkFor(b, at) {
    for (const t of [ at, at - 15 * 6e4, at + 2 * 6e4 ]) {
      const w = P.weekAt(t);
      if (w.b && w.b === b) return w;
    }
    return null;
  }
  P.weekAllow = (b, at, cap) => {
    const w = wkFor(b, at || Date.now());
    if (!w) return 0;
    const a = P.WEEK_ALLOW[w.st] || 0;
    return a < 1 ? Math.round((cap || 0) * a) : a;
  };
  P.weekKillMul = (b, at) => {
    const w = wkFor(b, at || Date.now());
    return w ? P.WEEK_KILL[w.st] || 1 : 1;
  };
  const WK_EXIT = " (옥상 집라인·완강기로 나와야 셉니다)";
  P.weekTask = now => {
    const w = P.weekAt(now), t = P.WEEK_TASK[w.st] || P.WEEK_TASK.horde, nm = P.weekName(w.b);
    const desc = w.st === "lock" ? "봉쇄된 " + nm + "에서 군 상자 " + t.n + "개를 열고 탈출" + WK_EXIT : w.st === "trove" ? nm + " 보물 금고를 열고 탈출" + WK_EXIT : nm + "에서 감염체 " + t.n + " 처치";
    return {
      id: "wwk",
      kind: "week",
      k: w.k,
      b: w.b,
      st: w.st,
      n: t.n,
      money: t.money,
      name: t.name,
      desc
    };
  };
  const M = 6e4;
  P.TRADERS = {
    gun: "무기상",
    ammo: "탄약상",
    med: "약재상",
    gear: "방어구상",
    teacher: "교감 선생님",
    metro: "역무원",
    vet: ""
  };
  P.QUESTS = [ {
    id: "g1",
    t: "gun",
    name: "청소",
    kind: "kill",
    what: "scav",
    n: 8,
    money: 5e5,
    desc: "약탈자 여덟을 쓰러뜨려 주십시오. 어디든 좋습니다."
  }, {
    id: "g2",
    t: "gun",
    name: "군번줄",
    kind: "fetch",
    item: "군번줄",
    n: 2,
    money: 8e5,
    items: [ "5.56mm 탄창", "5.56mm 탄창" ],
    desc: "쓰러진 군인 군번줄 두 개. 가족에게 보낼 것입니다."
  }, {
    id: "g3",
    t: "gun",
    name: "상가 정리",
    kind: "kill",
    what: "scav",
    b: "mall",
    n: 20,
    money: 25e5,
    desc: "상가 건물 약탈자 20명. 길을 뚫어야 물건이 돌아갑니다."
  }, {
    id: "g4",
    t: "gun",
    name: "두목 사냥",
    kind: "kill",
    what: "boss",
    n: 1,
    money: 5e6,
    items: [ "5.56mm 탄통" ],
    desc: "옥상 약탈자 두목 하나. 건물은 상관없습니다."
  }, {
    id: "a1",
    t: "ammo",
    name: "건전지",
    kind: "fetch",
    item: "건전지 묶음",
    n: 2,
    money: 3e5,
    items: [ "9mm 탄창", "9mm 탄창", "9mm 탄창" ],
    desc: "건전지 묶음 둘. 장약 기계가 먹습니다."
  }, {
    id: "a2",
    t: "ammo",
    name: "사무동 왕복",
    kind: "extract",
    b: "office",
    n: 2,
    money: 1e6,
    desc: "사무동에 들어갔다 살아서 두 번 나와 주십시오 (옥상 집라인·완강기로 나와야 셉니다)"
  }, {
    id: "a3",
    t: "ammo",
    name: "휘발유",
    kind: "fetch",
    item: "휘발유 통",
    n: 2,
    money: 15e5,
    items: [ "7.62mm 탄창", "7.62mm 탄창" ],
    desc: "휘발유 통 둘. 발전기가 서면 탄도 멈춥니다."
  }, {
    id: "a4",
    t: "ammo",
    name: "밤 병원",
    kind: "extract",
    b: "hos",
    night: true,
    n: 1,
    money: 4e6,
    desc: "밤에 종합병원에서 살아 나와 주십시오 (옥상 집라인·완강기로 나와야 셉니다)"
  }, {
    id: "m1",
    t: "med",
    name: "시료",
    kind: "fetch",
    item: "감염체 조직",
    n: 5,
    money: 4e5,
    items: [ "구급킷" ],
    desc: "감염체 조직 다섯. 억제약을 흉내 내는 데 씁니다."
  }, {
    id: "m2",
    t: "med",
    name: "방역",
    kind: "kill",
    what: "zombie",
    n: 40,
    money: 12e5,
    desc: "감염체 40마리를 쓰러뜨려 주십시오."
  }, {
    id: "m3",
    t: "med",
    name: "진료기록",
    kind: "fetch",
    item: "병원 진료기록",
    n: 3,
    money: 25e5,
    items: [ "항생제", "항생제" ],
    desc: ""
  }, {
    id: "m4",
    t: "med",
    name: "병원 순례",
    kind: "extract",
    b: "hos",
    n: 3,
    money: 6e6,
    desc: "종합병원에서 세 번 살아 나와 주십시오 (옥상 집라인·완강기로 나와야 셉니다)"
  }, {
    id: "r1",
    t: "gear",
    name: "연립 순찰",
    kind: "extract",
    b: "villa",
    n: 3,
    money: 5e5,
    desc: "연립주택에서 세 번 살아 나와 주십시오 (옥상 집라인·완강기로 나와야 셉니다)"
  }, {
    id: "r2",
    t: "gear",
    name: "사원증",
    kind: "fetch",
    item: "회사 사원증",
    n: 3,
    money: 12e5,
    desc: "회사 사원증 셋. 출입 기록을 맞춰 볼 것입니다."
  }, {
    id: "r3",
    t: "gear",
    name: "금고 열쇠",
    kind: "fetch",
    item: "은행 금고 열쇠",
    n: 1,
    money: 2e6,
    items: [ "방탄모" ],
    desc: "은행 금고 열쇠 하나. 무엇이 들었는지는 묻지 마십시오."
  }, {
    id: "r4",
    t: "gear",
    name: "병원 두목",
    kind: "kill",
    what: "boss",
    b: "hos",
    n: 1,
    money: 8e6,
    items: [ "플레이트 캐리어" ],
    desc: "종합병원 옥상 두목. 끝까지 살아서 오면 제일 좋은 조끼를 드립니다."
  }, {
    id: "s1",
    t: "teacher",
    name: "하교 시간",
    kind: "extract",
    b: "school",
    n: 2,
    money: 9e5,
    desc: "고등학교에 들어갔다 두 번 살아 나와 주십시오. 아이들이 다니던 길을 알아야 합니다 (옥상 집라인·완강기로 나와야 셉니다)"
  }, {
    id: "s2",
    t: "teacher",
    name: "생활기록부",
    kind: "fetch",
    item: "학생 생활기록부",
    n: 3,
    money: 15e5,
    items: [ "소프트 방탄조끼" ],
    desc: "교무실 생활기록부 셋. 어느 반 아이들이 살아남았는지 찾고 싶습니다."
  }, {
    id: "s3",
    t: "teacher",
    name: "교실 정리",
    kind: "kill",
    what: "zombie",
    b: "school",
    n: 30,
    money: 2e6,
    desc: "고등학교 감염체 30마리. 교실을 다시 쓸 수 있게."
  }, {
    id: "s4",
    t: "teacher",
    name: "밤 학교",
    kind: "extract",
    b: "school",
    night: true,
    n: 1,
    money: 3e6,
    items: [ "경찰 방석모" ],
    desc: "밤에 고등학교에서 살아 나와 주십시오. 손전등을 잊지 마십시오 (옥상 집라인·완강기로 나와야 셉니다)"
  }, {
    id: "t1",
    t: "metro",
    name: "막차",
    kind: "extract",
    b: "metro",
    n: 2,
    money: 2e6,
    desc: "터미널에서 두 번 살아 나와 주십시오. 비상등만으로 길을 익혀 보십시오 (옥상 집라인·완강기로 나와야 셉니다)"
  }, {
    id: "t2",
    t: "metro",
    name: "들개 떼",
    kind: "kill",
    what: "zombie",
    b: "metro",
    n: 25,
    money: 25e5,
    items: [ "방탄판 조끼" ],
    desc: "터미널 감염체 25마리. 들개 떼도 셉니다."
  }, {
    id: "t3",
    t: "metro",
    name: "관제실 열쇠",
    kind: "fetch",
    item: "관제실 열쇠",
    n: 1,
    money: 3e6,
    items: [ "전술 헬멧" ],
    desc: "관제실 열쇠 하나. 관리실 책상이나 사물함을 뒤져 보십시오."
  }, {
    id: "t4",
    t: "metro",
    name: "터미널 두목",
    kind: "kill",
    what: "boss",
    b: "metro",
    n: 1,
    money: 7e6,
    items: [ "군용 방탄복" ],
    desc: "터미널 옥상 두목 하나. 터미널을 되찾을 것입니다."
  }, {
    id: "v1",
    t: "vet",
    name: "정찰",
    kind: "extract",
    b: "base",
    n: 1,
    money: 3e6,
    desc: "군부대에 들어갔다 살아 나와 주십시오. 저격수 조준선을 보면 엄폐하십시오 (옥상 집라인·완강기로 나와야 셉니다)"
  }, {
    id: "v2",
    t: "vet",
    name: "탈영병 소탕",
    kind: "kill",
    what: "scav",
    b: "base",
    n: 25,
    money: 5e6,
    items: [ "7.62mm 탄창", "7.62mm 탄창" ],
    desc: "군부대 탈영병(약탈자) 25명."
  }, {
    id: "v3",
    t: "vet",
    name: "작전 지도",
    kind: "fetch",
    item: "군 작전 지도",
    n: 2,
    money: 6e6,
    items: [ "중형 방탄 헬멧" ],
    desc: "지휘실 작전 지도 둘. 녀석들이 어디로 가는지 알아야 합니다."
  }, {
    id: "v4",
    t: "vet",
    name: "군부대 두목",
    kind: "kill",
    what: "boss",
    b: "base",
    n: 1,
    money: 12e6,
    items: [ "중전투 방탄복" ],
    desc: "군부대 옥상 두목. 해내면 폭발물 처리반 방탄복을 드립니다."
  } ];
  P.qById = id => P.QUESTS.find(q => q.id === id) || null;
  P.qNew = () => ({
    done: [],
    prog: {},
    lastId: null
  });
  P.current = function(st) {
    st = st || P.qNew();
    const out = {};
    for (const t of Object.keys(P.TRADERS)) out[t] = P.QUESTS.find(q => q.t === t && st.done.indexOf(q.id) < 0) || null;
    return out;
  };
  P.Q_OPEN = 2;
  P.open = function(st) {
    st = st || P.qNew();
    const done = Array.isArray(st.done) ? st.done : [], out = {};
    for (const t of Object.keys(P.TRADERS)) out[t] = P.QUESTS.filter(q => q.t === t && done.indexOf(q.id) < 0).slice(0, P.Q_OPEN);
    return out;
  };
  P.openPairs = function(st) {
    const o = P.open(st), out = [];
    for (const t of Object.keys(o)) for (const q of o[t]) out.push([ t, q ]);
    return out;
  };
  P.openList = st => P.openPairs(st).map(e => e[1]);
  P.isOpen = (st, q) => !!q && (P.open(st)[q.t] || []).indexOf(q) >= 0;
  const KMAX = {
    scav: 120,
    zombie: 150,
    boss: 1
  };
  P.report = function(st, raid) {
    if (!st || !raid || raid.id == null || st.lastId === raid.id || raid.b === "train") return [];
    st.lastId = raid.id;
    const k = raid.kills || {}, fin = [];
    for (const q of P.openList(st)) {
      if (!q || q.kind === "fetch") continue;
      let add = 0;
      if (q.kind === "kill") {
        if (!q.b || q.b === raid.b) add = Math.max(0, Math.min(KMAX[q.what] || 0, k[q.what] | 0));
      } else if (q.kind === "extract") {
        if (P.realExit(raid) && (!q.b || q.b === raid.b) && (!q.night || raid.tod === "night")) add = 1;
      } else if (P.MIS && P.MIS[q.kind]) add = P.misAdd(q, raid);
      if (!add) continue;
      const before = st.prog[q.id] | 0;
      st.prog[q.id] = Math.min(q.n, before + add);
      if (before < q.n && st.prog[q.id] >= q.n) fin.push(q.id);
    }
    return fin;
  };
  P.preview = function(st, raid) {
    if (!st || !raid || raid.b === "train") return [];
    const k = raid.kills || {}, out = [];
    for (const q of P.openList(st)) {
      if (!q || q.kind === "fetch") continue;
      let add = 0;
      if (q.kind === "kill") {
        if (!q.b || q.b === raid.b) add = Math.max(0, Math.min(KMAX[q.what] || 0, k[q.what] | 0));
      } else if (q.kind === "extract") {
        if (P.realExit(raid) && (!q.b || q.b === raid.b) && (!q.night || raid.tod === "night")) add = 1;
      } else if (P.MIS && P.MIS[q.kind]) add = P.misAdd(q, raid);
      if (!add) continue;
      const before = st.prog[q.id] | 0;
      out.push({
        q,
        before,
        add: Math.min(q.n, before + add) - before
      });
    }
    return out;
  };
  P.FISH_NAMES = [ "피라미", "블루길", "붕어", "배스", "누치", "잉어", "메기", "장어", "쏘가리" ];
  P.GROUPS = {
    물고기: P.FISH_NAMES
  };
  P.nameOk = (want, have) => want === have || !!(P.GROUPS[want] && P.GROUPS[want].indexOf(have) >= 0);
  P.qtyOf = null;
  P.qty = it => !it ? 0 : P.qtyOf ? P.qtyOf(it) : root.SX && root.SX.items && root.SX.items.qty ? root.SX.items.qty(it) : 1;
  P.countIn = function(grid, name) {
    let n = 0;
    for (const e of grid && grid.list || []) if (e.it && P.nameOk(name, e.it.name)) n += P.qty(e.it);
    return n;
  };
  P.kitGrids = data => {
    const k = data && data.kit;
    return k ? [ "rig", "bag" ].map(sl => k[sl] && k[sl].grid).filter(g => g && Array.isArray(g.list)) : [];
  };
  P.safeGrids = data => {
    const s = data && data.safe, out = [];
    if (!s || typeof s !== "object") return out;
    if (s.grid && Array.isArray(s.grid.list)) out.push(s.grid);
    if (Array.isArray(s.ext)) for (const e of s.ext.slice(0, 12)) if (e && e.grid && Array.isArray(e.grid.list)) out.push(e.grid);
    return out;
  };
  P.fridgeGrids = data => {
    const h = data && data.home, out = [];
    if (!h || !Array.isArray(h.furn)) return out;
    for (const f of h.furn) {
      if (!f || f.kind !== "fridge") continue;
      const g = f.gridObj && Array.isArray(f.gridObj.list) ? f.gridObj : f.grid;
      if (g && Array.isArray(g.list)) out.push(g);
    }
    return out;
  };
  P.creelGrid = data => {
    const g = data && data.creel;
    return g && Array.isArray(g.list) ? g : null;
  };
  P.creelGrids = data => {
    const g = P.creelGrid(data);
    return !g ? [] : g.bait && typeof g.bait === "object" && Array.isArray(g.bait.list) ? [ g, g.bait ] : [ g ];
  };
  P.extraGrids = data => P.fridgeGrids(data).concat(P.creelGrids(data));
  P.haveIn = (data, name) => P.countIn(data && data.stash, name) + P.kitGrids(data).concat(P.safeGrids(data), P.extraGrids(data)).reduce((t, g) => t + P.countIn(g, name), 0);
  P.keepAll = data => {
    const L = [ data && data.stash ].concat(P.kitGrids(data), P.safeGrids(data), P.extraGrids(data)).filter(g => g && Array.isArray(g.list)).map(g => [ g, g.list.slice(), g.list.map(e => e && e.it ? e.it.n : undefined) ]);
    return () => {
      for (const [g, l, ns] of L) {
        g.list = l;
        l.forEach((e, k) => {
          if (e && e.it && ns[k] !== undefined) e.it.n = ns[k];
        });
      }
    };
  };
  P.progress = function(st, data, q) {
    return q.kind === "fetch" ? Math.min(q.n, P.haveIn(data, q.item)) : Math.min(q.n, (st && st.prog[q.id]) | 0);
  };
  P.ready = (st, data, q) => !!q && P.progress(st, data, q) >= q.n;
  P.claim = function(st, data, id, h) {
    const q = P.qById(id);
    if (!q) return {
      ok: false,
      msg: "없는 의뢰"
    };
    if (!P.isOpen(st, q)) return {
      ok: false,
      msg: st.done.indexOf(id) >= 0 ? "이미 끝낸 의뢰" : "아직 차례가 아닌 의뢰"
    };
    if (!P.ready(st, data, q)) return {
      ok: false,
      msg: "아직 다 못 했습니다 — " + P.progress(st, data, q) + "/" + q.n
    };
    const give = q.items || [];
    if (h.room && !h.room(give)) return {
      ok: false,
      msg: "보관함에 보상 넣을 자리가 없습니다"
    };
    if (q.kind === "fetch") {
      const back = P.keepAll(data);
      for (let i = 0; i < q.n; i++) if (!h.take(q.item)) {
        back();
        return {
          ok: false,
          msg: q.item + " 이 모자랍니다"
        };
      }
    }
    data.money = Math.max(0, Math.round((+data.money || 0) + q.money));
    const got = [];
    for (const n of give) if (h.give(n)) got.push(n);
    st.done.push(id);
    delete st.prog[id];
    return {
      ok: true,
      msg: P.TRADERS[q.t] + " 의뢰 「" + q.name + "」 완료 — " + won(q.money) + (got.length ? " + " + got.join(", ") : ""),
      q
    };
  };
  const DAY = 1440, PRICE = [ 42e5, 875e4, 1645e4 ];
  P.FAC = [ {
    id: "gen",
    name: "발전기",
    desc: "남는 전기로 배터리를 채웁니다. 윗단계일수록 큰 배터리·무전기·태양광 충전기.",
    lv: [ {
      outs: [ [ "건전지 묶음", 8 ], [ "보조배터리", 8 ], [ "리튬 배터리 팩", 4 ] ]
    }, {
      outs: [ [ "보조배터리", 10 ], [ "리튬 배터리 팩", 8 ], [ "무전기", 4 ], [ "차량용 배터리", 2 ] ]
    }, {
      outs: [ [ "리튬 배터리 팩", 10 ], [ "차량용 배터리", 4 ], [ "무전기", 4 ], [ "태양광 충전기", 3 ] ]
    } ]
  }, {
    id: "forge",
    name: "정비 작업대",
    desc: "고철을 깎아 총 파츠를 만들어 상자에 담습니다. 상자는 우클릭으로 엽니다.",
    lv: [ {
      outs: [ [ "하급 파츠 상자", 8 ] ]
    }, {
      outs: [ [ "하급 파츠 상자", 4 ], [ "중급 파츠 상자", 8 ] ]
    }, {
      outs: [ [ "중급 파츠 상자", 6 ], [ "상급 파츠 상자", 8 ] ]
    } ]
  }, {
    id: "med",
    name: "약품 선반",
    desc: "약을 만듭니다. 윗단계는 군용 응급 파우치·수술 키트까지.",
    lv: [ {
      outs: [ [ "진통제", 10 ], [ "지혈대", 15 ], [ "진통 주사기", 4 ], [ "항생제", 3 ] ]
    }, {
      outs: [ [ "지혈대", 10 ], [ "진통 주사기", 9 ], [ "항생제", 6 ], [ "군용 응급 파우치", 5 ] ]
    }, {
      outs: [ [ "진통 주사기", 10 ], [ "항생제", 10 ], [ "군용 응급 파우치", 6 ], [ "수술 키트", 4 ] ]
    } ]
  }, {
    id: "bench",
    name: "탄약 작업대",
    desc: "낡은 탄피를 다시 채워 탄 상자로 묶습니다. 3단계는 수류탄도 나올 때가 있습니다.",
    lv: [ {
      outs: [ [ "9mm 탄 상자", 10 ], [ "5.56mm 탄 상자", 5 ] ]
    }, {
      outs: [ [ "9mm 탄 상자", 10 ], [ "5.56mm 탄 상자", 6 ], [ "7.62mm 탄 상자", 5 ] ]
    }, {
      outs: [ [ "9mm 탄 상자", 10 ], [ "5.56mm 탄 상자", 10 ], [ "7.62mm 탄 상자", 11 ] ],
      rand: [ [ "수류탄", 0, 3 ] ]
    } ]
  }, {
    id: "still",
    name: "증류기",
    desc: "술을 빚어 팝니다. 약재상에게 배운 달임으로 억제약을 흉내 내 아주 가끔 하나 냅니다(단계마다 7일 · 4.5일 · 3일에 하나).",
    lv: [ {
      outs: [ [ "증류 소주 짝", 3 ] ],
      side: [ "증상 억제약", 7 * DAY ]
    }, {
      outs: [ [ "증류 소주 짝", 1 ], [ "전통 청주 상자", 4 ] ],
      side: [ "증상 억제약", 4.5 * DAY ]
    }, {
      outs: [ [ "전통 청주 상자", 1 ], [ "숙성 양주", 6 ] ],
      side: [ "증상 억제약", 3 * DAY ]
    } ]
  }, {
    id: "vault",
    name: "금고 공방",
    week: true,
    desc: "개인 금고를 1주일에 하나 만듭니다. 단계만큼 칸이 큰 금고입니다(1단계 1칸 … 10단계 10칸). 셸터에서 우클릭으로 쓰면 보존 기간 동안 가방 창에 금고가 생기고, 지나면 사라집니다(든 것은 보관함으로). 쓰지 않고 두거나 팔 수 있습니다.",
    lv: [ 1e7, 15e6, 2e7, 3e7, 4e7, 55e6, 7e7, 9e7, 12e7, 15e7 ].map((price, i) => ({
      outs: [ [ "개인 금고 " + (i + 1) + "칸", 1 ] ],
      price,
      every: 7 * DAY
    }))
  }, {
    id: "vaultTime",
    name: "금고 보존 장치",
    need: "vault",
    addon: true,
    desc: "개인 금고를 쓴 때부터 남아 있는 기간을 하루씩 늘립니다(기본 1일 · 끝 단계 7일). 이미 쓴 금고에는 적용되지 않습니다.",
    lv: [ 1e6, 3e6, 7e6, 15e6, 3e7, 5e7 ].map(price => ({
      outs: [],
      price
    }))
  } ];
  for (const f of P.FAC) f.lv.forEach((L, i) => {
    if (L.price == null) L.price = PRICE[i];
    if (L.every == null) L.every = DAY;
  });
  const FAC_NEED = {
    gen: [ [ [ "충전 케이블", 3 ], [ "건전지 낱개", 2 ], [ "절연테이프", 1 ] ], [ [ "구리 전선", 3 ], [ "건전지 묶음", 2 ], [ "휘발유 통", 1 ] ], [ [ "소형 모터", 2 ], [ "구리 전선", 4 ], [ "휘발유 통", 2 ] ] ],
    forge: [ [ [ "나사 한 줌", 2 ], [ "볼트 한 줌", 2 ], [ "사포", 2 ] ], [ [ "스패너", 1 ], [ "몽키렌치", 1 ], [ "너트 한 줌", 3 ], [ "철판", 1 ] ], [ [ "소형 모터", 1 ], [ "철판", 2 ], [ "몽키렌치", 2 ] ] ],
    med: [ [ [ "붕대", 3 ], [ "소독약", 1 ], [ "비누 한 장", 2 ] ], [ [ "구급킷", 2 ], [ "항생제", 1 ], [ "정수 필터", 1 ] ], [ [ "수술 키트", 1 ], [ "진통 주사기", 2 ], [ "희귀 의약품 상자", 1 ] ] ],
    bench: [ [ [ "빈 탄피 한 줌", 4 ], [ "성냥갑", 3 ] ], [ [ "빈 탄피 한 줌", 6 ], [ "화약 통", 1 ], [ "스패너", 1 ] ], [ [ "화약 통", 3 ], [ "수류탄", 2 ], [ "철판", 1 ] ] ],
    still: [ [ [ "생수병", 3 ], [ "부탄가스", 1 ], [ "배관 이음쇠", 2 ] ], [ [ "구리 냉각관", 1 ], [ "청주 한 병", 2 ], [ "꿀단지", 1 ] ], [ [ "구리 냉각관", 2 ], [ "정수 필터", 1 ], [ "꿀단지", 2 ] ] ],
    vault: [ [ [ "자물쇠", 2 ], [ "경첩", 2 ] ], [ [ "자물쇠", 3 ], [ "경첩", 3 ], [ "볼트 한 줌", 2 ] ], [ [ "철판", 1 ], [ "자물쇠", 3 ], [ "열쇠 꾸러미", 2 ] ], [ [ "철판", 2 ], [ "경첩", 4 ], [ "몽키렌치", 1 ] ], [ [ "철판", 2 ], [ "금고 다이얼", 1 ], [ "자물쇠", 4 ] ], [ [ "철판", 3 ], [ "금고 다이얼", 1 ], [ "소형 모터", 1 ] ], [ [ "철판", 3 ], [ "금고 다이얼", 2 ], [ "몽키렌치", 2 ] ], [ [ "철판", 4 ], [ "금고 다이얼", 2 ], [ "노트북", 1 ] ], [ [ "철판", 4 ], [ "금고 다이얼", 3 ], [ "보안실 마스터키", 1 ] ], [ [ "철판", 5 ], [ "금고 다이얼", 3 ], [ "현장 소장의 금고 열쇠", 1 ] ] ],
    vaultTime: [ [ [ "청테이프", 1 ], [ "건전지 낱개", 2 ] ], [ [ "청테이프", 2 ], [ "건전지 묶음", 1 ] ], [ [ "청테이프", 2 ], [ "보조배터리", 1 ], [ "구리 전선", 2 ] ], [ [ "태블릿", 1 ], [ "보조배터리", 2 ], [ "구리 전선", 3 ] ], [ [ "노트북", 1 ], [ "금고 다이얼", 1 ], [ "보조배터리", 3 ] ], [ [ "노트북", 2 ], [ "금고 다이얼", 1 ], [ "소형 모터", 2 ] ] ]
  };
  for (const f of P.FAC) f.lv.forEach((L, i) => {
    if (!Array.isArray(L.items)) L.items = ((FAC_NEED[f.id] || [])[i] || []).map(q => q.slice());
  });
  P.facNeed = function(fs, id) {
    const f = P.facById(id), L = f && f.lv[P.facLevel(fs, id)];
    return L && Array.isArray(L.items) ? L.items : [];
  };
  P.facLack = (fs, data, id) => P.facNeed(fs, id).map(([n, c]) => [ n, c - P.haveIn(data, n) ]).filter(q => q[1] > 0);
  P.vaultDays = fs => 1 + P.facLevel(fs, "vaultTime");
  P.facById = id => P.FAC.find(f => f.id === id) || null;
  P.fNew = () => ({});
  P.facLevel = (fs, id) => fs && fs[id] ? fs[id].lv | 0 : 0;
  P.facFrac = function(fs, id, now) {
    const f = P.facById(id), s = fs && fs[id];
    if (!f || !s || !s.lv) return 0;
    const L = f.lv[Math.min(f.lv.length, s.lv) - 1], every = L && L.every || DAY;
    if (!L || !L.outs.length) return 0;
    return Math.max(0, Math.min(1, (now - (s.last || now)) / (every * M)));
  };
  P.facSideReady = function(fs, id, now) {
    const f = P.facById(id), s = fs && fs[id];
    if (!f || !s || !s.lv) return false;
    const L = f.lv[s.lv - 1];
    if (!L.side) return false;
    return now - (s.side != null ? s.side : s.last || now) >= L.side[1] * M;
  };
  P.facItems = function(fs, id, now, rnd) {
    const f = P.facById(id), s = fs && fs[id];
    if (!f || !s || !s.lv) return [];
    const L = f.lv[s.lv - 1], fr = P.facFrac(fs, id, now), out = [];
    for (const [n, c] of L.outs) {
      const k = Math.floor(c * fr + 1e-9);
      if (k > 0) out.push([ n, k ]);
    }
    if (fr >= 1 && L.rand) for (const [n, a, b] of L.rand) {
      const k = a + Math.floor((rnd ? rnd() : .5) * (b - a + 1));
      if (k > 0) out.push([ n, k ]);
    }
    if (P.facSideReady(fs, id, now)) out.push([ L.side[0], 1 ]);
    return out;
  };
  P.facReady = (fs, id, now) => P.facItems(fs, id, now).reduce((t, q) => t + q[1], 0);
  P.facBuild = function(fs, data, id, now, h, rnd) {
    const f = P.facById(id);
    if (!f) return {
      ok: false,
      msg: "없는 설비"
    };
    const lv = P.facLevel(fs, id);
    if (lv >= f.lv.length) return {
      ok: false,
      msg: f.name + " — 이미 끝 단계"
    };
    if (f.need && !P.facLevel(fs, f.need)) {
      const nf = P.facById(f.need);
      return {
        ok: false,
        msg: (nf ? nf.name : f.need) + " 을(를) 먼저 지어야 합니다"
      };
    }
    const L = f.lv[lv];
    if ((+data.money || 0) < L.price) return {
      ok: false,
      msg: "돈이 모자랍니다 — " + won(L.price) + " 필요"
    };
    const need = Array.isArray(L.items) ? L.items : [], lack = P.facLack(fs, data, id);
    if (lack.length) return {
      ok: false,
      msg: "물건이 모자랍니다 — " + lack.map(([n, k]) => n + " " + k).join(", ")
    };
    if (need.length && !(h && h.take)) return {
      ok: false,
      msg: "물건을 가져갈 수 없습니다"
    };
    if (need.length) {
      const back = P.keepAll(data);
      for (const [n, c] of need) for (let i = 0; i < c; i++) if (!h.take(n)) {
        back();
        return {
          ok: false,
          msg: n + " 이 모자랍니다"
        };
      }
    }
    const used = need.reduce((t, q) => t + q[1], 0);
    let kept = "";
    if (lv && h) {
      const items = P.facItems(fs, id, now, rnd || Math.random);
      if (items.length) {
        const names = [];
        for (const [n, k] of items) for (let i = 0; i < k; i++) names.push(n);
        if (h.room && h.room(names)) {
          for (const n of names) h.give(n);
          kept = " · 쌓인 것(" + names.length + "개)은 보관함으로";
        } else {
          let v = 0;
          for (const n of names) v += Math.max(0, Math.floor(h.price(n) || 0));
          data.money = Math.round((+data.money || 0) + v);
          kept = " · 쌓인 것은 자리가 없어 " + won(v) + "에 팔았습니다";
        }
      }
    }
    data.money = Math.round(data.money - L.price);
    const old = fs[id];
    fs[id] = {
      lv: lv + 1,
      last: now,
      side: old && old.side != null ? old.side : now
    };
    const usedS = used ? " · 재료 " + used + "개를 썼습니다" : "";
    if (f.id === "vaultTime") return {
      ok: true,
      msg: "금고 보존 장치 " + (lv + 1) + "단계 — 앞으로 쓰는 개인 금고는 " + P.vaultDays(fs) + "일 동안 남습니다" + usedS
    };
    return {
      ok: true,
      msg: f.name + (lv ? " " + (lv + 1) + "단계로 올렸습니다" : " 을(를) 지었습니다") + " — " + L.outs.map(q => q[0]).join(" · ") + kept + usedS
    };
  };
  function facReset(fs, id, now, items) {
    const s = fs[id], f = P.facById(id), L = f.lv[s.lv - 1];
    if (items.some(([n]) => L.outs.some(q => q[0] === n) || (L.rand || []).some(q => q[0] === n))) s.last = now;
    if (L.side && items.some(([n]) => n === L.side[0])) s.side = now;
  }
  P.FAC_KEEP = [ "증상 억제약" ];
  P.FAC_ALL_SKIP = [ "vault" ];
  P.facClaim = function(fs, data, id, now, h, rnd, only) {
    const f = P.facById(id), s = fs && fs[id];
    if (!f || !s || !s.lv) return {
      ok: false,
      msg: "아직 안 지은 설비"
    };
    let items = P.facItems(fs, id, now, rnd || Math.random);
    if (only) {
      items = items.filter(([n]) => P.FAC_KEEP.includes(n));
      if (!items.length) return {
        ok: false,
        msg: "받을 증상 억제약이 없습니다"
      };
    }
    if (!items.length) return {
      ok: false,
      msg: "아직 만든 게 없습니다"
    };
    const names = [];
    for (const [n, k] of items) for (let i = 0; i < k; i++) names.push(n);
    if (!h.room(names)) return {
      ok: false,
      msg: "보관함에 자리가 모자랍니다(" + names.length + "개) — [판매]로 바로 팔 수 있습니다"
    };
    for (const n of names) h.give(n);
    facReset(fs, id, now, items);
    return {
      ok: true,
      n: names.length,
      msg: f.name + " — " + items.map(([n, k]) => n + " " + k).join(" · ") + " 받았습니다"
    };
  };
  P.facSell = function(fs, data, id, now, h, rnd, keep) {
    const f = P.facById(id), s = fs && fs[id];
    if (!f || !s || !s.lv) return {
      ok: false,
      msg: "아직 안 지은 설비"
    };
    let items = P.facItems(fs, id, now, rnd || Math.random);
    if (keep) items = items.filter(([n]) => !P.FAC_KEEP.includes(n));
    if (!items.length) return {
      ok: false,
      msg: "아직 만든 게 없습니다"
    };
    let v = 0;
    for (const [n, k] of items) for (let i = 0; i < k; i++) v += Math.max(0, Math.floor(h.price(n) || 0));
    if (!v) return {
      ok: false,
      msg: "팔 수 없는 물건"
    };
    facReset(fs, id, now, items);
    data.money = Math.round((+data.money || 0) + v);
    return {
      ok: true,
      v,
      msg: f.name + " — " + items.map(([n, k]) => n + " " + k).join(" · ") + " 을(를) " + won(v) + "에 팔았습니다"
    };
  };
  const DAYMS = 864e5, KST = 9 * 36e5;
  P.dayKey = now => Math.floor((now + KST) / DAYMS);
  P.weekKey = now => Math.floor((P.dayKey(now) + 3) / 7);
  const HARD = [ "mall", "hos", "metro", "base" ];
  P.DAILY_POOL = [ {
    id: "dx1",
    kind: "extract",
    n: 2,
    money: 3e5,
    name: "두 번 살아 나오기",
    desc: "어느 건물이든 두 번 탈출 (옥상 집라인·완강기 · 야외 지도는 끝 출구로 나와야 셉니다)"
  }, {
    id: "dx2",
    kind: "extract",
    n: 1,
    night: true,
    money: 45e4,
    name: "밤 외출",
    desc: "밤에 한 번 탈출 (옥상 집라인·완강기 · 야외 지도는 끝 출구로 나와야 셉니다)"
  }, {
    id: "dx3",
    kind: "extract",
    n: 1,
    ev: true,
    money: 4e5,
    name: "사건 현장",
    desc: "판 상황이 있는 판에서 한 번 탈출 (옥상 집라인·완강기 · 야외 지도는 끝 출구로 나와야 셉니다)"
  }, {
    id: "dx4",
    kind: "extract",
    n: 1,
    b: "*hard",
    money: 5e5,
    name: "험한 곳",
    desc: "상가·병원·터미널·군부대 중 한 곳에서 탈출 (옥상 집라인·완강기 · 야외 지도는 끝 출구로 나와야 셉니다)"
  }, {
    id: "dk1",
    kind: "kill",
    what: "zombie",
    n: 15,
    money: 3e5,
    name: "방역 당번",
    desc: "감염체 15마리 쓰러뜨리기"
  }, {
    id: "dk2",
    kind: "kill",
    what: "scav",
    n: 8,
    money: 4e5,
    name: "약탈자 정리",
    desc: "약탈자 여덟 쓰러뜨리기"
  }, {
    id: "dg1",
    kind: "gain",
    v: 5e5,
    n: 1,
    money: 35e4,
    name: "한몫 챙기기",
    desc: "한 판에 50만 원어치 넘게 들고 나오기"
  }, {
    id: "ds1",
    kind: "search",
    n: 20,
    money: 25e4,
    name: "살림 뒤지기",
    desc: "상자 20개 다 뒤지기"
  }, {
    id: "dt1",
    kind: "disarm",
    n: 2,
    money: 3e5,
    name: "함정 해체",
    desc: "함정 둘 풀기(인계철선·곰덫)"
  } ];
  P.WEEKLY_POOL = [ {
    id: "wx1",
    kind: "extract",
    n: 10,
    money: 3e6,
    name: "한 주 버티기",
    desc: "10번 탈출 (옥상 집라인·완강기 · 야외 지도는 끝 출구로 나와야 셉니다)"
  }, {
    id: "wn1",
    kind: "named",
    n: 1,
    money: 4e6,
    name: "이름난 놈",
    desc: "건물 전용 두목 하나 쓰러뜨리기"
  }, {
    id: "wb1",
    kind: "kill",
    what: "boss",
    n: 1,
    money: 35e5,
    name: "옥상 두목",
    desc: "옥상 약탈자 두목 하나 쓰러뜨리기"
  }, {
    id: "wk1",
    kind: "kill",
    what: "scav",
    n: 60,
    money: 3e6,
    name: "소탕 작전",
    desc: "약탈자 60명 쓰러뜨리기"
  }, {
    id: "wg1",
    kind: "gain",
    v: 3e6,
    n: 1,
    money: 35e5,
    name: "큰 건",
    desc: "한 판에 300만 원어치 넘게 들고 나오기"
  }, {
    id: "ws1",
    kind: "search",
    n: 120,
    money: 25e5,
    name: "싹쓸이",
    desc: "상자 120개 다 뒤지기"
  } ];
  function pickN(pool, n, seed) {
    let a = seed >>> 0 || 1;
    const r = () => {
      a = Math.imul(a, 1103515245) + 12345 >>> 0;
      return a / 4294967296;
    };
    const L = pool.slice();
    for (let k = L.length - 1; k > 0; k--) {
      const j = Math.floor(r() * (k + 1));
      const t = L[k];
      L[k] = L[j];
      L[j] = t;
    }
    return L.slice(0, n);
  }
  P.dailyList = now => pickN(P.DAILY_POOL, 3, P.dayKey(now) * 7919 + 13);
  P.weeklyList = now => pickN(P.WEEKLY_POOL, 2, P.weekKey(now) * 104729 + 7).concat([ P.weekTask(now) ]);
  P.dNew = () => ({
    day: 0,
    wk: 0,
    dp: {},
    dd: [],
    wp: {},
    wd: [],
    lastId: null
  });
  P.dRoll = function(st, now) {
    const d = P.dayKey(now), w = P.weekKey(now);
    if (st.day !== d) {
      st.day = d;
      st.dp = {};
      st.dd = [];
    }
    if (st.wk !== w) {
      st.wk = w;
      st.wp = {};
      st.wd = [];
    }
    if (!st.dp) st.dp = {};
    if (!st.dd) st.dd = [];
    if (!st.wp) st.wp = {};
    if (!st.wd) st.wd = [];
    return st;
  };
  const DMAX = {
    scav: 120,
    zombie: 150,
    boss: 1,
    named: 1,
    search: 150,
    disarm: 30
  };
  function dAdd(q, raid) {
    const k = raid.kills || {};
    if (q.kind === "extract") return P.realExit(raid) && (!q.b || (q.b === "*hard" ? HARD.indexOf(raid.b) >= 0 : q.b === raid.b)) && (!q.night || raid.tod === "night") && (!q.ev || !!raid.ev) ? 1 : 0;
    if (q.kind === "kill") return Math.max(0, Math.min(DMAX[q.what] || 0, k[q.what] | 0));
    if (q.kind === "gain") return raid.win && (+raid.gained || 0) >= q.v ? 1 : 0;
    if (q.kind === "search") return Math.max(0, Math.min(DMAX.search, raid.searched | 0));
    if (q.kind === "disarm") return Math.max(0, Math.min(DMAX.disarm, raid.disarm | 0));
    if (q.kind === "named") return Math.max(0, Math.min(1, k.named | 0));
    if (q.kind === "week") {
      const w = raid.wk;
      if (!w || w.k !== q.k || w.b !== q.b || w.st !== q.st || raid.b !== q.b) return 0;
      if (q.st === "horde") return Math.max(0, Math.min(DMAX.zombie, k.zombie | 0));
      if (!P.realExit(raid)) return 0;
      return q.st === "lock" ? Math.max(0, Math.min(q.n, w.mil | 0)) : w.vault ? 1 : 0;
    }
    return 0;
  }
  const dLists = now => [ [ P.dailyList(now), "dp", "dd" ], [ P.weeklyList(now), "wp", "wd" ] ];
  P.dReport = function(st, raid, now) {
    if (!st || !raid || raid.id == null || st.lastId === raid.id || raid.b === "train") return [];
    st.lastId = raid.id;
    P.dRoll(st, now);
    const fin = [];
    for (const [list, pk, dk] of dLists(now)) for (const q of list) {
      if (st[dk].indexOf(q.id) >= 0) continue;
      const add = dAdd(q, raid);
      if (!add) continue;
      const before = st[pk][q.id] | 0;
      st[pk][q.id] = Math.min(q.n, before + add);
      if (before < q.n && st[pk][q.id] >= q.n) fin.push(q.id);
    }
    return fin;
  };
  P.dPreview = function(st, raid, now) {
    if (!raid || raid.b === "train") return [];
    const s2 = P.dRoll(JSON.parse(JSON.stringify(st || P.dNew())), now), out = [];
    for (const [list, pk, dk] of dLists(now)) for (const q of list) {
      if (s2[dk].indexOf(q.id) >= 0) continue;
      const add = dAdd(q, raid);
      if (!add) continue;
      const before = s2[pk][q.id] | 0;
      out.push({
        q,
        before,
        add: Math.min(q.n, before + add) - before
      });
    }
    return out;
  };
  P.dState = function(st, now) {
    const s2 = P.dRoll(JSON.parse(JSON.stringify(st || P.dNew())), now), out = [];
    for (const [list, pk, dk] of dLists(now)) for (const q of list) out.push({
      q,
      prog: Math.min(q.n, s2[pk][q.id] | 0),
      done: s2[dk].indexOf(q.id) >= 0,
      weekly: pk === "wp"
    });
    return out;
  };
  P.dById = id => P.DAILY_POOL.concat(P.WEEKLY_POOL).find(q => q.id === id) || (id === "wwk" ? P.weekTask(Date.now()) : null);
  P.dClaim = function(st, data, id, now) {
    P.dRoll(st, now);
    for (const [list, pk, dk] of dLists(now)) {
      const q = list.find(x => x.id === id);
      if (!q) continue;
      if (st[dk].indexOf(id) >= 0) return {
        ok: false,
        msg: "이미 받은 과제"
      };
      if ((st[pk][id] | 0) < q.n) return {
        ok: false,
        msg: "아직 다 못 했습니다 — " + (st[pk][id] | 0) + "/" + q.n
      };
      data.money = Math.max(0, Math.round((+data.money || 0) + q.money));
      st[dk].push(id);
      return {
        ok: true,
        msg: (pk === "wp" ? "이번 주 과제" : "오늘 과제") + " 「" + q.name + "」 — " + won(q.money)
      };
    }
    return {
      ok: false,
      msg: "오늘(이번 주) 과제가 아닙니다"
    };
  };
  P.RECIPES = [ {
    id: "bandage",
    out: [ [ "붕대", 2 ] ],
    in: [ [ "헌 청바지", 1 ], [ "두루마리 휴지", 1 ] ],
    desc: "헌 옷을 찢어 삶습니다"
  }, {
    id: "powerbank",
    out: [ [ "보조배터리", 1 ] ],
    in: [ [ "건전지 묶음", 1 ], [ "충전 케이블", 1 ] ],
    desc: "건전지를 이어 붙입니다"
  }, {
    id: "ramen",
    out: [ [ "끓인 라면", 1 ] ],
    in: [ [ "봉지라면", 1 ], [ "생수병", 1 ], [ "김치 한 포기", 1 ] ],
    food: true,
    heat: true,
    desc: "김치를 넣고 가스레인지에 끓입니다 — 배가 든든합니다"
  }, {
    id: "antiseptic",
    out: [ [ "소독약", 1 ] ],
    in: [ [ "소주 두 병", 1 ] ],
    fac: [ "med", 1 ],
    desc: "소주를 졸여 소독약으로"
  }, {
    id: "tourniquet",
    out: [ [ "지혈대", 1 ] ],
    in: [ [ "노끈 뭉치", 1 ], [ "케이블 타이", 1 ], [ "붕대", 1 ] ],
    fac: [ "med", 1 ],
    desc: "끈과 붕대로 지혈대를 묶습니다"
  }, {
    id: "radio",
    out: [ [ "무전기", 1 ] ],
    in: [ [ "충전 케이블", 1 ], [ "이어폰", 1 ], [ "건전지 묶음", 1 ], [ "키보드", 1 ] ],
    fac: [ "gen", 1 ],
    desc: "부품을 모아 무전기를 조립합니다"
  }, {
    id: "partbox",
    out: [ [ "하급 파츠 상자", 1 ] ],
    in: [ [ "나사 한 줌", 1 ], [ "너트 한 줌", 1 ], [ "볼트 한 줌", 1 ], [ "스패너", 1 ], [ "사포", 1 ] ],
    fac: [ "forge", 1 ],
    desc: "고철을 깎아 파츠를 만듭니다"
  }, {
    id: "grenade",
    out: [ [ "수류탄", 1 ] ],
    in: [ [ "배관 이음쇠", 1 ], [ "못 한 줌", 1 ], [ "부탄가스", 1 ], [ "절연테이프", 1 ] ],
    fac: [ "bench", 1 ],
    desc: "배관에 못과 가스를 채웁니다 — 위험합니다"
  }, {
    id: "kimchi",
    out: [ [ "김치 한 포기", 1 ] ],
    in: [ [ "배추", 1 ], [ "고추", 3 ], [ "소금 봉지", 1 ] ],
    food: true,
    desc: "배추를 소금에 절여 고추를 빻아 버무립니다"
  }, {
    id: "potato",
    out: [ [ "삶은 감자", 2 ] ],
    in: [ [ "감자", 2 ], [ "생수병", 2 ], [ "소금 봉지", 1 ] ],
    food: true,
    heat: true,
    desc: "가스레인지에 감자를 삶아 소금을 칩니다 — 든든합니다"
  }, {
    id: "salad",
    out: [ [ "채소 샐러드", 1 ] ],
    in: [ [ "상추", 3 ], [ "방울토마토", 3 ], [ "식용유", 1 ], [ "간장 한 병", 1 ] ],
    food: true,
    desc: "상추와 방울토마토를 씻어 간장 · 기름 양념을 뿌립니다 — 목도 축입니다"
  }, {
    id: "autowater",
    out: [ [ "자동 급수기", 1 ] ],
    in: [ [ "샴푸통", 1 ], [ "배관 이음쇠", 1 ], [ "케이블 타이", 1 ], [ "절연테이프", 1 ] ],
    desc: "빈 통에 꼭지를 달고 호스를 이어 텃밭 급수기를 만듭니다"
  }, {
    id: "grillFish",
    out: [ [ "구운 생선", 1 ] ],
    in: [ [ "물고기", 1 ], [ "식용유", 1 ], [ "소금 봉지", 1 ] ],
    food: true,
    heat: true,
    desc: "기름을 두르고 소금을 쳐 가스레인지에 굽습니다 — 날것보다 훨씬 든든합니다"
  } ];
  P.rById = id => P.RECIPES.find(r => r.id === id) || null;
  P.KITCHEN = {
    counter: "prepCounter",
    stove: "kitchen"
  };
  P.hasFurn = (data, kind) => {
    const h = data && data.home;
    return !!(h && Array.isArray(h.furn) && h.furn.some(f => f && f.kind === kind && f.placed));
  };
  P.GAS = {
    CAN: "부탄가스",
    USES: 4,
    CAP: 4
  };
  P.gasOf = function(f) {
    const K = P.GAS, c = Math.max(0, Math.min(K.CAP, (f && f.gas) | 0)), u = Math.max(0, Math.min(K.USES, (f && f.gasUse) | 0));
    return {
      cans: c,
      use: u,
      n: u + c * K.USES,
      cap: K.CAP
    };
  };
  P.gasShort = f => {
    const n = P.gasOf(f).n;
    return n ? "가스 " + n + "회" : "가스 없음";
  };
  P.gasLabel = f => {
    const n = P.gasOf(f).n;
    return n ? "가스 " + n + "회" : "가스가 없습니다 — 부탄가스를 넣어 주십시오";
  };
  P.stoves = data => {
    const h = data && data.home;
    return h && Array.isArray(h.furn) ? h.furn.filter(f => f && f.kind === P.KITCHEN.stove && f.placed) : [];
  };
  P.stoveFor = function(data, fid) {
    const S = P.stoves(data), id = fid == null ? null : Math.floor(+fid), mine = id == null ? null : S.find(f => f.id === id);
    if (mine) return P.gasOf(mine).n > 0 ? mine : null;
    return S.find(f => P.gasOf(f).n > 0) || null;
  };
  P.gasTake = function(f) {
    const g = P.gasOf(f);
    if (!g.n) return false;
    let c = g.cans, u = g.use;
    if (!u) {
      c--;
      u = P.GAS.USES;
    }
    u--;
    f.gas = c;
    f.gasUse = u;
    return true;
  };
  P.gasPut = function(data, fid, h) {
    const id = Math.floor(+fid || 0), f = data && data.home && Array.isArray(data.home.furn) ? data.home.furn.find(q => q && q.id === id && q.kind === P.KITCHEN.stove) : null;
    if (!f) return {
      ok: false,
      msg: "가스레인지가 없습니다"
    };
    if (!f.placed) return {
      ok: false,
      msg: "셸터에 놓은 가스레인지에만 넣을 수 있습니다"
    };
    const g = P.gasOf(f);
    if (g.cans >= g.cap) return {
      ok: false,
      msg: "가스레인지가 가득 찼습니다 — 부탄가스 " + g.cap + "통까지"
    };
    if (!h.take(P.GAS.CAN)) return {
      ok: false,
      msg: "부탄가스가 없습니다 — 판에서 찾거나 좌판에서 사시면 됩니다"
    };
    f.gas = g.cans + 1;
    f.gasUse = g.use;
    return {
      ok: true,
      act: "gas",
      msg: "🔥 부탄가스를 가스레인지에 넣었습니다 — " + P.gasLabel(f)
    };
  };
  P.kitchenNo = function(data, r) {
    if (!r || !r.food) return "";
    if (r.heat) {
      if (!P.hasFurn(data, P.KITCHEN.stove)) return "싱크대·가스레인지가 셸터에 놓여 있어야 합니다(불이 드는 요리)";
      if (!P.stoveFor(data)) return "가스가 없습니다 — 부탄가스를 넣어 주십시오";
      return "";
    }
    if (!P.hasFurn(data, P.KITCHEN.counter)) return "조리대가 셸터에 놓여 있어야 합니다(시장 가구점 · 주방)";
    return "";
  };
  P.craftOk = function(fs, data, r) {
    if (r.fac && P.facLevel(fs, r.fac[0]) < r.fac[1]) {
      const f = P.facById(r.fac[0]);
      return (f ? f.name : r.fac[0]) + " " + r.fac[1] + "단계가 있어야 합니다";
    }
    const kn = P.kitchenNo(data, r);
    if (kn) return kn;
    const lack = r.in.filter(([n, c]) => P.haveIn(data, n) < c).map(([n, c]) => n + " " + (c - P.haveIn(data, n)));
    return lack.length ? "모자랍니다 — " + lack.join(", ") : "";
  };
  P.craft = function(fs, data, id, h, fid) {
    const r = P.rById(id);
    if (!r) return {
      ok: false,
      msg: "없는 제작법"
    };
    const no = P.craftOk(fs, data, r);
    if (no) return {
      ok: false,
      msg: no
    };
    const outs = [];
    for (const [n, c] of r.out) for (let i = 0; i < c; i++) outs.push(n);
    const back = P.keepAll(data);
    for (const [n, c] of r.in) for (let i = 0; i < c; i++) if (!h.take(n)) {
      back();
      return {
        ok: false,
        msg: n + " 이 모자랍니다"
      };
    }
    const food = !!r.food && typeof h.giveFood === "function";
    if (h.room && !h.room(outs, food)) {
      back();
      return {
        ok: false,
        msg: food ? "냉장고 · 보관함에 자리가 없습니다" : "보관함에 자리가 없습니다"
      };
    }
    const st = r.heat ? P.stoveFor(data, fid) : null;
    if (r.heat && !st) {
      back();
      return {
        ok: false,
        msg: "가스가 없습니다 — 부탄가스를 넣어 주십시오"
      };
    }
    let fridge = 0;
    for (const n of outs) {
      if (food) {
        if (h.giveFood(n) === "fridge") fridge++;
      } else h.give(n);
    }
    if (st) P.gasTake(st);
    const made = r.out.map(([n, c]) => n + (c > 1 ? " " + c : "")).join(", ");
    return {
      ok: true,
      msg: (r.food ? "🍳 " : "🛠 ") + made + " 만들었습니다" + (r.food ? fridge === outs.length ? " — 냉장고에 넣었습니다" : fridge ? " — 냉장고 · 보관함에" : " — 보관함에 넣었습니다" : "") + (st ? " · " + P.gasLabel(st) : ""),
      food: !!r.food,
      heat: !!r.heat,
      fridge,
      stove: st ? st.id : null,
      gas: st ? P.gasOf(st).n : null
    };
  };
  P.CROPS = {
    lettuce: {
      name: "상추",
      seed: "상추 씨앗",
      out: "상추",
      n: [ 2, 3 ],
      min: 60
    },
    pepper: {
      name: "고추",
      seed: "고추 씨앗",
      out: "고추",
      n: [ 3, 5 ],
      min: 120
    },
    tomato: {
      name: "방울토마토",
      seed: "방울토마토 씨앗",
      out: "방울토마토",
      n: [ 4, 6 ],
      min: 150
    },
    potato: {
      name: "감자",
      seed: "감자 씨눈",
      out: "감자",
      n: [ 2, 4 ],
      min: 180
    },
    cabbage: {
      name: "배추",
      seed: "배추 씨앗",
      out: "배추",
      n: [ 1, 1 ],
      min: 240
    }
  };
  P.CROP_KEYS = Object.keys(P.CROPS);
  P.GDN = {
    WET: 120,
    WILT: 360,
    DRY: .25,
    WORM: .25,
    SOON: 30
  };
  P.PLANTERS = {
    planter: 1,
    planterBig: 3
  };
  P.WATER_BOTTLE = "생수병";
  P.WORM = "지렁이";
  P.KIT = {
    NAME: "자동 급수기",
    CAP: 6
  };
  P.STAGES = [ "empty", "seed", "sprout", "young", "grown", "ripe", "dead" ];
  P.STAGE_NAME = {
    empty: "빈 칸",
    seed: "씨앗 — 물을 기다립니다",
    sprout: "싹",
    young: "잎이 났습니다",
    grown: "거의 다 자랐습니다",
    ripe: "다 자랐습니다 — 거두시면 됩니다",
    dead: "시들었습니다 — 뽑아서 치우시면 됩니다"
  };
  P.cropBySeed = n => P.CROP_KEYS.find(k => P.CROPS[k].seed === n) || null;
  P.gNew = () => ({
    v: 1,
    pl: {}
  });
  P.gFix = function(gs) {
    if (!gs || typeof gs !== "object") gs = P.gNew();
    if (!gs.pl || typeof gs.pl !== "object" || Array.isArray(gs.pl)) gs.pl = {};
    gs.v = 1;
    if (gs.kit != null) {
      if (typeof gs.kit !== "object" || Array.isArray(gs.kit)) delete gs.kit; else for (const id of Object.keys(gs.kit)) {
        const k = gs.kit[id];
        if (!k || typeof k !== "object" || !/^\d{1,9}$/.test(id)) {
          delete gs.kit[id];
          continue;
        }
        k.n = Math.max(0, Math.min(P.KIT.CAP, Math.floor(+k.n || 0)));
        k.t = Math.max(0, +k.t || 0);
        k.u = Math.max(+k.u || 0, k.t);
      }
    }
    return gs;
  };
  P.gTime = ms => {
    const m = Math.max(1, Math.ceil(ms / M));
    return m >= 60 ? Math.floor(m / 60) + "시간" + (m % 60 ? " " + m % 60 + "분" : "") : m + "분";
  };
  function gGrow(pl, now) {
    const C = P.CROPS[pl.c], K = P.GDN, need = C.min * M, w = +pl.w || 0;
    let g = Math.max(0, +pl.g || 0), d = Math.max(0, +pl.d || 0), t = Math.max(+pl.u || 0, +pl.p || 0), dead = !!pl.x;
    const wetEnd = w ? w + K.WET * M : 0, dieAt = w ? wetEnd + K.WILT * M : 0;
    if (now > t && !dead && w && g < need) {
      if (t < wetEnd) {
        const t1 = Math.min(now, wetEnd);
        g = Math.min(need, g + (t1 - t));
        t = t1;
      }
      if (now > t && g < need) {
        const tr = t + (need - g) / K.DRY, end = Math.min(now, dieAt);
        if (tr <= end) {
          d += tr - t;
          g = need;
        } else {
          g += Math.max(0, end - t) * K.DRY;
          d += Math.max(0, end - t);
          if (now >= dieAt) dead = true;
        }
      }
    }
    const ripe = !dead && g >= need - 1e-6;
    let ripeAt = 0;
    if (ripe) ripeAt = now; else if (!dead && w) {
      let gg = g, tt = now;
      if (tt < wetEnd) {
        const k = need - gg;
        if (tt + k <= wetEnd) ripeAt = tt + k; else {
          gg += wetEnd - tt;
          tt = wetEnd;
        }
      }
      if (!ripeAt) {
        const k = (need - gg) / K.DRY;
        if (tt + k <= dieAt) ripeAt = tt + k;
      }
    }
    return {
      g: Math.min(g, need),
      d,
      dead,
      ripe,
      need,
      frac: Math.min(1, g / need),
      wet: !!w && now < wetEnd,
      wetEnd,
      dieAt,
      ripeAt
    };
  }
  P.gView = function(pl, now) {
    if (!pl || !P.CROPS[pl.c]) return null;
    const v = gGrow(pl, now);
    v.stage = v.dead ? "dead" : !pl.w ? "seed" : v.ripe ? "ripe" : v.frac < .3 ? "sprout" : v.frac < .65 ? "young" : "grown";
    v.crop = P.CROPS[pl.c];
    return v;
  };
  P.gCode = function(pl, now) {
    const v = P.gView(pl, now);
    if (!v) return 0;
    return P.CROP_KEYS.indexOf(pl.c) * 7 + P.STAGES.indexOf(v.stage);
  };
  P.gVariant = function(codes) {
    let v = 0;
    for (let i = codes.length - 1; i >= 0; i--) v = v * 35 + (codes[i] | 0);
    return v;
  };
  const gSettle = (pl, now) => {
    const v = gGrow(pl, now);
    pl.g = Math.round(v.g);
    pl.d = Math.round(v.d);
    pl.u = now;
    if (v.dead) pl.x = 1;
    return v;
  };
  P.gFurn = function(data, fid) {
    const h = data && data.home, id = Math.floor(+fid || 0), f = h && Array.isArray(h.furn) ? h.furn.find(q => q && q.id === id) : null;
    return f && P.PLANTERS[f.kind] ? f : null;
  };
  P.gPlots = function(gs, f) {
    const n = P.PLANTERS[f.kind] || 0, k = String(f.id);
    let L = gs.pl[k];
    if (!Array.isArray(L)) L = gs.pl[k] = [];
    while (L.length < n) L.push(null);
    if (L.length > n) L.length = n;
    for (let i = 0; i < L.length; i++) if (L[i] && (typeof L[i] !== "object" || !P.CROPS[L[i].c])) L[i] = null;
    gShareWet(L);
    return L;
  };
  function gShareWet(L) {
    const WET = P.GDN.WET * M;
    for (const pl of L) {
      if (!pl || pl.w || pl.x || !(+pl.p > 0)) continue;
      let best = 0;
      for (const q of L) {
        if (!q || q === pl || !(+q.w > 0)) continue;
        if (+q.w <= +pl.p && +pl.p < +q.w + WET && +q.w > best) best = +q.w;
      }
      if (best) pl.w = best;
    }
  }
  P.gKitOf = (gs, f) => {
    const K = gs && gs.kit, k = K && f && typeof K === "object" ? K[String(f.id)] : null;
    return k && typeof k === "object" ? k : null;
  };
  function gKitRun(L, k, now, ev) {
    if (!k) return 0;
    const W = P.GDN.WET * M;
    let used = 0;
    for (let guard = 0; guard < 64 && (k.n | 0) > 0; guard++) {
      const u = +k.u || 0;
      let at = Infinity;
      for (const pl of L) {
        if (!pl || pl.x || !P.CROPS[pl.c]) continue;
        const t = Math.max(u, pl.w ? pl.w + W : Math.max(+pl.p || 0, +pl.u || 0)), v = gGrow(pl, t);
        if (v.dead || v.ripe) continue;
        if (t < at) at = t;
      }
      if (at === Infinity || at > now) break;
      for (const pl of L) {
        if (!pl || pl.x || !P.CROPS[pl.c]) continue;
        const v = gGrow(pl, at);
        if (v.dead || v.ripe) continue;
        gSettle(pl, at);
        pl.w = at;
      }
      k.n = (k.n | 0) - 1;
      k.u = at;
      used++;
      if (ev) ev.push(at);
    }
    if (now !== Infinity && now > (+k.u || 0)) k.u = now;
    return used;
  }
  P.gSim = function(gs, f, now) {
    const L0 = P.gPlots(P.gFix(gs), f), k0 = P.gKitOf(gs, f);
    if (!k0) return {
      L: L0,
      kit: null,
      used: 0
    };
    const L = L0.map(pl => pl ? Object.assign({}, pl) : null), kit = Object.assign({}, k0);
    return {
      L,
      kit,
      used: gKitRun(L, kit, now)
    };
  };
  P.gKitLv = k => !k ? 0 : (k.n | 0) <= 0 ? 1 : (k.n | 0) <= 2 ? 2 : (k.n | 0) <= 4 ? 3 : 4;
  P.gKitPlan = function(gs, f, now) {
    const s = P.gSim(gs, f, now);
    if (!s.kit) return null;
    const L = s.L.map(pl => pl ? Object.assign({}, pl) : null), k = Object.assign({}, s.kit), ev = [];
    gKitRun(L, k, Infinity, ev);
    const end = ev.length ? ev[ev.length - 1] : now, W = P.GDN.WET * M;
    const ripe = L.map(pl => {
      if (!pl || !P.CROPS[pl.c]) return 0;
      const T = Math.max(now, +pl.u || 0), v = gGrow(pl, T);
      return v.ripe ? T : v.ripeAt || 0;
    });
    let grow = 0;
    for (const pl of s.L) {
      if (!pl || !P.CROPS[pl.c]) continue;
      const v = gGrow(pl, now);
      if (!v.dead && !v.ripe) grow++;
    }
    const short = L.some((pl, i) => {
      if (!pl || !P.CROPS[pl.c]) return false;
      const v = gGrow(pl, end);
      return !v.dead && !v.ripe && !(ripe[i] && pl.w && ripe[i] <= pl.w + W);
    });
    return {
      n: s.kit.n | 0,
      cap: P.KIT.CAP,
      next: ev.length ? ev[0] : 0,
      empty: (k.n | 0) <= 0 ? end : 0,
      short,
      spare: k.n | 0,
      grow,
      ripe
    };
  };
  P.gSummary = function(gs, f, now) {
    const S = P.gSim(gs, f, now), L = S.L, o = {
      n: 0,
      ripe: 0,
      dead: 0,
      dry: 0,
      seed: 0,
      codes: [],
      kit: S.kit ? S.kit.n | 0 : -1,
      kitLv: P.gKitLv(S.kit)
    };
    for (const pl of L) {
      const v = P.gView(pl, now);
      o.codes.push(v ? P.CROP_KEYS.indexOf(pl.c) * 7 + P.STAGES.indexOf(v.stage) : 0);
      if (!v) continue;
      o.n++;
      if (v.stage === "ripe") o.ripe++; else if (v.stage === "dead") o.dead++; else if (v.stage === "seed") o.seed++; else if (!v.wet) o.dry++;
    }
    return o;
  };
  function gRng(f, k, pl, salt) {
    let s = ((f.id | 0) * 73856093 ^ (k + 1) * 19349663 ^ (Math.floor((+pl.p || 0) / 1e3) | 0) ^ (salt | 0)) >>> 0 || 1;
    return () => {
      s = Math.imul(s, 1103515245) + 12345 >>> 0;
      return s / 4294967296;
    };
  }
  P.gYield = function(f, k, pl) {
    const C = P.CROPS[pl.c], R = gRng(f, k, pl, 0);
    let n = C.n[0] + Math.floor(R() * (C.n[1] - C.n[0] + 1));
    if ((+pl.d || 0) > C.min * M) n = Math.max(1, n - 1);
    return {
      n,
      worm: R() < P.GDN.WORM
    };
  };
  function gOpen(gs, data, fid, now) {
    const f = P.gFurn(data, fid);
    if (!f) return {
      no: {
        ok: false,
        msg: "텃밭 상자가 없습니다"
      }
    };
    if (!f.placed) return {
      no: {
        ok: false,
        msg: "셸터에 놓은 텃밭 상자에만 할 수 있습니다"
      }
    };
    const L = P.gPlots(gs, f);
    if (now != null) gKitRun(L, P.gKitOf(gs, f), now);
    return {
      f,
      L
    };
  }
  P.gPlant = function(gs, data, fid, k, seed, now, h) {
    const o = gOpen(gs, data, fid, now);
    if (o.no) return o.no;
    k = k | 0;
    if (k < 0 || k >= o.L.length) return {
      ok: false,
      msg: "없는 칸입니다"
    };
    if (o.L[k]) return {
      ok: false,
      msg: "그 칸에는 이미 심겨 있습니다"
    };
    const c = P.cropBySeed(seed);
    if (!c) return {
      ok: false,
      msg: "심을 수 없는 것입니다"
    };
    if (!h.take(seed)) return {
      ok: false,
      msg: seed + "이 없습니다 — 약재상에서 사거나 판에서 찾으시면 됩니다"
    };
    o.L[k] = {
      c,
      p: now,
      w: 0,
      g: 0,
      u: now,
      d: 0
    };
    gShareWet(o.L);
    const kit = P.gKitOf(gs, o.f), auto = kit ? gKitRun(o.L, kit, now) : 0;
    return {
      ok: true,
      act: "plant",
      crop: c,
      auto,
      msg: "🌱 " + seed + "을 심었습니다 — " + (auto ? "급수기가 바로 물을 줬습니다" : o.L[k].w ? "흙이 촉촉해서 바로 자랍니다" : "물을 주면 싹이 틉니다") + "(다 자라기까지 약 " + P.gTime(P.CROPS[c].min * M) + ")"
    };
  };
  P.gWater = function(gs, data, fid, now, h) {
    const o = gOpen(gs, data, fid, now);
    if (o.no) return o.no;
    const K = P.GDN, live = o.L.filter(pl => {
      if (!pl) return false;
      const v = gGrow(pl, now);
      return !v.dead && !v.ripe;
    });
    if (!live.length) return {
      ok: false,
      msg: "물을 줄 것이 없습니다 — 자라는 것이 없습니다"
    };
    if (live.every(pl => pl.w && pl.w + K.WET * M - now > K.SOON * M)) {
      const left = Math.min(...live.map(pl => pl.w + K.WET * M - now)) - K.SOON * M;
      return {
        ok: false,
        msg: "흙이 아직 촉촉합니다 — " + P.gTime(left) + " 뒤에 주시면 됩니다"
      };
    }
    if (!h.take(P.WATER_BOTTLE)) return {
      ok: false,
      msg: "생수병이 없습니다 — 물은 생수병으로 줍니다(밥집 · 판에서)"
    };
    for (const pl of live) {
      gSettle(pl, now);
      pl.w = now;
    }
    return {
      ok: true,
      act: "water",
      msg: "💧 물을 줬습니다 — " + P.gTime(K.WET * M) + " 동안 촉촉합니다 · 생수병 하나를 썼습니다"
    };
  };
  P.gHarvest = function(gs, data, fid, k, now, h) {
    const o = gOpen(gs, data, fid, now);
    if (o.no) return o.no;
    k = k | 0;
    const pl = o.L[k];
    if (!pl) return {
      ok: false,
      msg: "빈 칸입니다"
    };
    const v = gGrow(pl, now), C = P.CROPS[pl.c];
    if (v.dead) return {
      ok: false,
      msg: "시들었습니다 — 뽑아서 치우시면 됩니다"
    };
    if (!v.ripe) {
      const kp = P.gKitOf(gs, o.f) ? P.gKitPlan(gs, o.f, now) : null, ra = kp ? kp.ripe[k] : v.ripeAt;
      return {
        ok: false,
        msg: "아직 덜 자랐습니다 — " + (ra ? "약 " + P.gTime(ra - now) + " 남았습니다" : !pl.w ? "물을 줘야 자랍니다" : kp ? "급수기 물이 모자랍니다 — 물탱크를 채워 주셔야 다 자랍니다" : "물을 주셔야 합니다(마르면 시듭니다)")
      };
    }
    gSettle(pl, now);
    const y = P.gYield(o.f, k, pl), names = [];
    for (let i = 0; i < y.n; i++) names.push(C.out);
    if (h.room && !h.room(names)) return {
      ok: false,
      msg: "보관함에 자리가 없습니다(" + C.out + " " + y.n + "개)"
    };
    let n = 0;
    for (const nm of names) if (h.give(nm)) n++;
    let worm = "";
    if (y.worm && (!h.room || h.room([ P.WORM ])) && h.give(P.WORM)) worm = " · 흙에서 지렁이 한 마리가 나왔습니다";
    o.L[k] = null;
    return {
      ok: true,
      act: "harvest",
      crop: pl.c,
      n,
      worm: !!worm,
      msg: "🧺 " + C.out + " " + n + "개를 거뒀습니다 — 보관함에 넣었습니다" + worm
    };
  };
  P.gClear = function(gs, data, fid, k, now, h) {
    const o = gOpen(gs, data, fid, now);
    if (o.no) return o.no;
    k = k | 0;
    const pl = o.L[k];
    if (!pl) return {
      ok: false,
      msg: "빈 칸입니다"
    };
    const v = gGrow(pl, now), C = P.CROPS[pl.c];
    if (v.ripe) return {
      ok: false,
      msg: "다 자랐습니다 — 거두시면 됩니다"
    };
    let worm = "";
    if (v.dead && gRng(o.f, k, pl, 753)() < P.GDN.WORM && (!h.room || h.room([ P.WORM ])) && h.give(P.WORM)) worm = " · 흙에서 지렁이 한 마리가 나왔습니다";
    o.L[k] = null;
    return {
      ok: true,
      act: "clear",
      crop: pl.c,
      worm: !!worm,
      msg: (v.dead ? "🥀 시든 " + C.name + " 줄기를 뽑았습니다" : "🌱 " + C.name + "을(를) 뽑아 버렸습니다 — 씨앗은 돌아오지 않습니다") + worm
    };
  };
  P.kitTank = it => Math.max(0, Math.min(P.KIT.CAP, Math.floor(+(it && it.tank) || 0)));
  P.kitItems = data => {
    const out = [];
    if (!data) return out;
    for (const g of [ data.stash ].concat(P.kitGrids(data), P.safeGrids(data), P.extraGrids(data))) if (g && Array.isArray(g.list)) for (const e of g.list) if (e && e.it && e.it.name === P.KIT.NAME) out.push(e.it);
    return out;
  };
  P.gKitOn = function(gs, data, fid, now, h) {
    const o = gOpen(gs, data, fid, now);
    if (o.no) return o.no;
    if (!gs.kit || typeof gs.kit !== "object" || Array.isArray(gs.kit)) gs.kit = {};
    const id = String(o.f.id);
    if (gs.kit[id]) return {
      ok: false,
      msg: "이미 급수기가 달려 있습니다 — 상자 하나에 하나입니다"
    };
    const ks = P.kitItems(data);
    if (ks.length > 1) {
      let b = ks[0];
      for (const q of ks) if (P.kitTank(q) > P.kitTank(b)) b = q;
      if (b !== ks[0]) {
        const t0 = P.kitTank(ks[0]), t1 = P.kitTank(b);
        if (t1) ks[0].tank = t1; else delete ks[0].tank;
        if (t0) b.tank = t0; else delete b.tank;
      }
    }
    if (!h.take(P.KIT.NAME)) return {
      ok: false,
      msg: "자동 급수기가 없습니다 — 약재상에서 사거나 작업대에서 만드시면 됩니다"
    };
    const left = new Set(P.kitItems(data)), took = ks.find(q => !left.has(q)), n = took ? P.kitTank(took) : 0;
    gs.kit[id] = {
      n,
      t: now,
      u: now
    };
    const auto = n ? gKitRun(o.L, gs.kit[id], now) : 0;
    return {
      ok: true,
      act: "kitOn",
      kit: gs.kit[id].n,
      auto,
      msg: n ? "🚿 자동 급수기를 달았습니다 — 물탱크에 든 물 " + n + "병으로 이어서 흙이 마를 때마다 물을 줍니다" + (auto ? " · 마른 흙에 바로 한 병을 줬습니다" : "") : "🚿 자동 급수기를 달았습니다 — 물탱크에 생수병을 채우시면 흙이 마를 때마다 알아서 물을 줍니다"
    };
  };
  P.gKitFill = function(gs, data, fid, n, now, h) {
    const o = gOpen(gs, data, fid, now);
    if (o.no) return o.no;
    const k = P.gKitOf(gs, o.f), cap = P.KIT.CAP;
    if (!k) return {
      ok: false,
      msg: "급수기가 없습니다 — 먼저 급수기를 다시면 됩니다"
    };
    if ((k.n | 0) >= cap) return {
      ok: false,
      msg: "물탱크가 가득 찼습니다 — 생수병 " + cap + "병까지"
    };
    const want = Math.max(1, Math.min(cap, Math.floor(+n || 1)));
    let put = 0;
    while (put < want && (k.n | 0) < cap && h.take(P.WATER_BOTTLE)) {
      k.n = (k.n | 0) + 1;
      put++;
    }
    if (!put) return {
      ok: false,
      msg: "생수병이 없습니다 — 밥집에서 사거나 판에서 찾으시면 됩니다"
    };
    k.u = Math.max(+k.u || 0, now);
    const auto = gKitRun(o.L, k, now);
    return {
      ok: true,
      act: "kitFill",
      kit: k.n,
      n: put,
      auto,
      msg: "💧 물탱크에 생수병 " + put + "병을 부었습니다" + (auto ? " — 마른 흙에 바로 한 병을 줬습니다" : "") + " · 물탱크 " + k.n + "/" + cap + "병"
    };
  };
  P.gKitOff = function(gs, data, fid, now, h) {
    const o = gOpen(gs, data, fid, now);
    if (o.no) return o.no;
    const k = P.gKitOf(gs, o.f);
    if (!k) return {
      ok: false,
      msg: "달린 급수기가 없습니다"
    };
    const n = k.n | 0;
    if (h.room && !h.room([ P.KIT.NAME ])) return {
      ok: false,
      msg: "보관함에 자리가 없습니다(급수기)"
    };
    const was = new Set(P.kitItems(data));
    if (!h.give(P.KIT.NAME)) return {
      ok: false,
      msg: "보관함에 자리가 없습니다"
    };
    const it = P.kitItems(data).find(q => !was.has(q));
    let back = 0;
    if (it) {
      if (n) it.tank = n; else delete it.tank;
    } else for (let i = 0; i < n; i++) if (h.give(P.WATER_BOTTLE)) back++;
    delete gs.kit[String(o.f.id)];
    return {
      ok: true,
      act: "kitOff",
      kit: -1,
      n: back,
      tank: it ? n : 0,
      msg: "🚿 급수기를 뗐습니다 — 보관함에 넣었습니다" + (it && n ? " · 물탱크에 남은 물 " + n + "병은 그대로 들어 있습니다(다시 달면 그 물로 이어서 줍니다)" : back ? " · 탱크에 남은 물은 생수병 " + back + "병으로 돌려받았습니다" : "")
    };
  };
  P.gAct = function(gs, data, b, now, h) {
    b = b || {};
    if (!data || !data.home) return {
      ok: false,
      msg: "셸터를 못 읽었습니다"
    };
    gs = P.gFix(gs);
    if (b.act === "plant") return P.gPlant(gs, data, b.furn, b.slot, String(b.seed || ""), now, h);
    if (b.act === "water") return P.gWater(gs, data, b.furn, now, h);
    if (b.act === "harvest") return P.gHarvest(gs, data, b.furn, b.slot, now, h);
    if (b.act === "clear") return P.gClear(gs, data, b.furn, b.slot, now, h);
    if (b.act === "kitOn") return P.gKitOn(gs, data, b.furn, now, h);
    if (b.act === "kitFill") return P.gKitFill(gs, data, b.furn, b.n, now, h);
    if (b.act === "kitOff") return P.gKitOff(gs, data, b.furn, now, h);
    return {
      ok: false,
      msg: "없는 일"
    };
  };
  P.EG = [ {
    name: "",
    desc: "",
    items: [ [ "경비대장 무전기", 1 ], [ "무전기", 3 ] ],
    money: 15e6,
    pay: ""
  }, {
    name: "",
    desc: "",
    items: [ [ "휘발유 통", 6 ], [ "차량용 배터리", 2 ] ],
    money: 25e6,
    pay: ""
  }, {
    name: "",
    desc: "",
    items: [ [ "소령 계급장", 1 ], [ "군 작전 지도", 2 ] ],
    money: 4e7,
    pay: ""
  }, {
    name: "",
    desc: "",
    items: [ [ "상급 파츠 상자", 2 ], [ "리튬 배터리 팩", 4 ], [ "보안실 마스터키", 1 ] ],
    money: 6e7,
    pay: ""
  } ];
  P.egNew = () => ({
    n: 0,
    won: 0
  });
  P.egTotal = sst => P.EG.reduce((t, e, i) => t + P.egOf(i, sst).money, 0);
  P.egIn = st => Math.max(0, Math.floor(+(st && st.paid) || 0));
  P.egRemain = (st, sst) => {
    const step = P.egOf((st && st.n) | 0, sst);
    return step ? Math.max(0, step.money - P.egIn(st)) : 0;
  };
  P.egPaid = (st, sst) => {
    const n = (st && st.n) | 0, step = P.egOf(n, sst);
    return P.EG.slice(0, n).reduce((t, e, i) => t + P.egOf(i, sst).money, 0) + (step ? Math.min(P.egIn(st), step.money) : 0);
  };
  P.egLack = function(st, data, sst) {
    const s = st || P.egNew(), step = P.egOf(s.n | 0, sst === undefined ? data && data.story : sst);
    if (!step) return "";
    const lack = step.items.filter(([n, c]) => P.haveIn(data, n) < c).map(([n, c]) => n + " " + (c - P.haveIn(data, n)));
    const rem = Math.max(0, step.money - P.egIn(s)), have = +(data && data.money) || 0;
    if (have < rem) lack.push("돈 " + won(rem - have));
    return lack.length ? "모자랍니다 — " + lack.join(", ") : "";
  };
  P.egStep = function(st, data, h, sst, amt) {
    if (sst === undefined) sst = data && data.story;
    const step = P.egOf(st.n | 0, sst);
    if (!step) return {
      ok: false,
      msg: "작전 준비는 다 끝났습니다 — 여의도 헬기장으로"
    };
    const paid = P.egIn(st), rem = Math.max(0, step.money - paid);
    if (amt != null && amt !== "") {
      const have = Math.max(0, Math.floor(+(data && data.money) || 0));
      if (!rem) return {
        ok: false,
        msg: "이 단계 돈은 다 넣었습니다 — 물건을 갖춰 [넘겨주기]를 누르십시오"
      };
      const put = amt === "all" ? Math.min(rem, have) : Math.min(rem, Math.floor(+amt || 0));
      if (!(put > 0)) return {
        ok: false,
        msg: "넣을 돈이 없습니다"
      };
      if (have < put) return {
        ok: false,
        msg: "돈이 모자랍니다 — " + won(put - have)
      };
      data.money = Math.round((+data.money || 0) - put);
      st.paid = paid + put;
      return {
        ok: true,
        put,
        msg: "🚁 「" + step.name + "」 작전 자금 " + won(st.paid) + " / " + won(step.money) + (st.paid >= step.money ? " — 돈은 다 모였습니다" : "")
      };
    }
    const no = P.egLack(st, data, sst);
    if (no) return {
      ok: false,
      msg: no
    };
    const back = P.keepAll(data);
    for (const [n, c] of step.items) for (let i = 0; i < c; i++) if (!h.take(n)) {
      back();
      return {
        ok: false,
        msg: n + " 이 모자랍니다"
      };
    }
    data.money = Math.round((+data.money || 0) - rem + Math.max(0, paid - step.money));
    st.n = (st.n | 0) + 1;
    if (st.paid != null) st.paid = 0;
    return {
      ok: true,
      msg: "🚁 서울 탈출 작전 " + st.n + "/" + P.EG.length + " 「" + step.name + "」 끝" + (st.n >= P.EG.length ? " — 도심 지도에 여의도 헬기장이 열렸습니다" : "")
    };
  };
  P.egReady = st => ((st && st.n) | 0) >= P.EG.length;
  P.ST_WHO = {
    uncle: "",
    clerk: "",
    courier: "",
    nurse: "",
    student: "",
    foreman: "",
    taxi: "",
    grad: "",
    gun: "",
    ammo: "",
    med: "",
    gear: "",
    broker: "",
    smuggle: "",
    merc: "",
    insure: "",
    estate: "",
    teacher: "",
    metro: "",
    vet: ""
  };
  P.B_NAMES = {
    villa: "연립주택",
    office: "사무동",
    school: "고등학교",
    mall: "상가 건물",
    metro: "터미널",
    bridge: "한강 다리",
    tunnel: "지하철 터널",
    site: "재개발 공사장",
    hos: "종합병원",
    base: "군부대",
    heli: "여의도 헬기장",
    train: "연습장"
  };
  P.ST_START = [ "villa" ];
  P.STORY = [];
  P.SIDES = {
    vet: {
      who: "vet",
      name: "",
      end: "",
      shop: "gun",
      eg: {
        2: {
          money: 2e7,
          pay: ""
        }
      },
      conf: {
        head: "",
        up: "",
        eg: "",
        fly: ""
      },
      hello: "",
      endLines: [ "", "", "" ],
      close: [ "", "", "" ],
      rsLine: "",
      rsIntro: ""
    },
    smuggle: {
      who: "smuggle",
      name: "",
      end: "",
      shop: "smuggle",
      eg: {
        1: {
          money: 5e6,
          pay: ""
        }
      },
      conf: {
        head: "",
        up: "",
        eg: "",
        fly: ""
      },
      hello: "",
      endLines: [ "", "", "" ],
      close: [ "", "" ],
      rsLine: "",
      rsIntro: ""
    },
    med: {
      who: "med",
      name: "",
      end: "",
      shop: "med",
      eg: {
        3: {
          money: 4e7,
          add: [ [ "증상 억제약", 2 ] ],
          pay: ""
        }
      },
      conf: {
        head: "",
        up: "",
        eg: "",
        fly: ""
      },
      hello: "",
      endLines: [ "", "" ],
      close: [ "", "" ],
      rsLine: "",
      rsIntro: ""
    },
    none: {
      who: "uncle",
      name: "",
      end: "",
      shop: null,
      eg: {},
      conf: {
        head: ""
      },
      hello: null,
      endLines: null,
      close: [ "", "" ],
      rsLine: null,
      rsIntro: null
    }
  };
  P.ENDS3 = [ "vet", "smuggle", "med" ];
  P.STORY_FORK = [];
  {
    const k = P.STORY.findIndex(m => m.id === "m23");
    P.STORY.splice(k + 1, 0, ...P.STORY_FORK);
  }
  P.PICK = {
    id: "pick",
    main: true,
    who: "vet",
    name: "",
    obj: {
      kind: "talk"
    },
    brief: ""
  };
  P.stSide = st => st && typeof st.side === "string" && P.SIDES[st.side] ? st.side : null;
  P.stLegacy = st => !!(st && (st.legacy || !st.v && Array.isArray(st.done) && st.done.indexOf("m23") >= 0));
  P.stMig = function(st) {
    if (!st || typeof st !== "object" || st.v) return st;
    if (Array.isArray(st.done) && st.done.indexOf("m23") >= 0) st.legacy = 1;
    st.v = 2;
    return st;
  };
  P.stSideOk = (st, m) => !m.side || (m.pick ? !P.stSide(st) : P.stSide(st) === m.side);
  P.stMainBase = () => P.STORY.filter(m => m.main && !m.side);
  P.stSideList = sd => P.STORY.filter(m => m.side === sd);
  P.stMainFor = st => {
    const sd = P.stSide(st);
    return P.stMainBase().concat(sd ? P.stSideList(sd) : []);
  };
  P.stPickOpen = st => P.stDone(st, "m24") && !P.stSide(st);
  P.stCountText = function(st) {
    const B = P.stMainBase(), sd = P.stSide(st), L = sd ? P.stSideList(sd) : [], d = m => P.stDone(st, m.id);
    return "본 줄거리 " + B.filter(d).length + "/" + B.length + (L.length ? " · 갈림길 " + L.filter(d).length + "/" + L.length : "");
  };
  const stPick = function(st, data, m, h) {
    const s0 = st.side, e0 = st.egAt;
    st.side = m.side;
    st.egAt = (data && data.eg && data.eg.n) | 0;
    st.act[m.id] = {
      p: 1
    };
    const r = P.stClaim(st, data, m.id, h);
    if (!r.ok) {
      delete st.act[m.id];
      if (s0 === undefined) delete st.side; else st.side = s0;
      if (e0 === undefined) delete st.egAt; else st.egAt = e0;
      return r;
    }
    r.side = m.side;
    r.pick = true;
    return r;
  };
  P.egOf = function(i, sst) {
    const e = P.EG[i];
    if (!e) return e;
    const sd = P.SIDES[P.stSide(sst)], o = sd && sd.eg && sd.eg[i];
    if (!o || i < ((sst && sst.egAt) | 0)) return e;
    return Object.assign({}, e, {
      money: o.money != null ? o.money : e.money,
      pay: o.pay || e.pay,
      items: e.items.concat(o.add || [])
    });
  };
  P.endAdd = function(save, st) {
    const sd = P.stSide(st);
    if (!save || !sd) return false;
    if (!Array.isArray(save.ends)) save.ends = [];
    if (save.ends.indexOf(sd) >= 0) return false;
    save.ends.push(sd);
    return true;
  };
  P.rsSideLine = st => {
    const sd = P.SIDES[P.stSide(st)];
    return sd && sd.rsIntro ? [ sd.rsIntro ] : [];
  };
  P.stById = id => P.STORY.find(m => m.id === id) || null;
  P.stMain = () => P.STORY.filter(m => m.main);
  P.stNew = () => ({
    done: [],
    act: {},
    lastId: null,
    v: 2
  });
  const stFix = st => {
    if (!st || typeof st !== "object") st = P.stNew();
    if (!Array.isArray(st.done)) st.done = [];
    if (!st.act || typeof st.act !== "object") st.act = {};
    return st;
  };
  P.stDone = (st, id) => !!st && Array.isArray(st.done) && st.done.indexOf(id) >= 0;
  P.stActive = (st, id) => !!st && !!st.act && Object.prototype.hasOwnProperty.call(st.act, id);
  P.stOpen = (st, m) => !P.stDone(st, m.id) && !P.stActive(st, m.id) && (m.req || []).every(r => P.stDone(st, r)) && P.stSideOk(st, m);
  P.stMainDone = st => P.stMain().every(m => m.fork || P.stDone(st, m.id)) && (P.stLegacy(st) || P.stDone(st, "m24") && !!P.stSide(st) && P.stSideList(P.stSide(st)).every(m => P.stDone(st, m.id)));
  P.stUnlocked = function(st) {
    const out = {};
    for (const b of P.ST_START) out[b] = true;
    out.train = true;
    for (const m of P.STORY) if (m.unlock && P.stDone(st, m.id)) out[m.unlock] = true;
    return out;
  };
  P.stCanGo = (st, b) => !!P.stUnlocked(st)[b];
  P.ST_TIER = {
    villa: 0,
    office: 1,
    school: 1,
    mall: 2,
    metro: 2,
    bridge: 2,
    tunnel: 2,
    site: 2,
    hos: 3,
    base: 3,
    heli: 4
  };
  P.ST_TIER_NAMES = [ "적막", "위험", "아수라장", "지옥", "마지막" ];
  P.stReach = function(st) {
    const un = P.stUnlocked(st);
    let r = 0;
    for (const b in un) if (un[b] && P.ST_TIER[b] != null) r = Math.max(r, P.ST_TIER[b]);
    return r;
  };
  P.stCanFollow = (st, b) => P.ST_TIER[b] == null || P.ST_TIER[b] <= P.stReach(st) + 1;
  P.stUnlockBy = b => P.STORY.find(m => m.unlock === b) || null;
  P.stNeed = m => m.obj.kind === "talk" || m.obj.kind === "find" ? 1 : m.obj.kind === "fetch" ? m.obj.items.reduce((t, q) => t + q[1], 0) : m.obj.n || 1;
  P.stProg = function(st, m, h) {
    const o = m.obj, cnt = n => h && h.count ? h.count(n) : 0;
    if (o.kind === "talk") return 1;
    if (o.kind === "find") return Math.min(1, cnt(o.item));
    if (o.kind === "fetch") return o.items.reduce((t, q) => t + Math.min(q[1], cnt(q[0])), 0);
    const a = st && st.act && st.act[m.id];
    return Math.min(P.stNeed(m), (a && a.p) | 0);
  };
  P.stReady = (st, m, h) => P.stActive(st, m.id) && P.stProg(st, m, h) >= P.stNeed(m);
  const SMAX = {
    scav: 120,
    zombie: 150,
    boss: 1,
    named: 1,
    search: 150,
    disarm: 30
  };
  function stAdd(o, raid) {
    const k = raid.kills || {};
    if (o.kind === "extract") return P.realExit(raid) && (!o.b || o.b === raid.b) && (!o.night || raid.tod === "night") ? 1 : 0;
    if (o.kind === "kill") return !o.b || o.b === raid.b ? Math.max(0, Math.min(SMAX[o.what] || 0, k[o.what] | 0)) : 0;
    if (o.kind === "named") return !o.b || o.b === raid.b ? Math.max(0, Math.min(1, k.named | 0)) : 0;
    if (o.kind === "gain") return raid.win && (+raid.gained || 0) >= o.v ? 1 : 0;
    if (o.kind === "search") return !o.b || o.b === raid.b ? Math.max(0, Math.min(SMAX.search, raid.searched | 0)) : 0;
    if (o.kind === "disarm") return Math.max(0, Math.min(SMAX.disarm, raid.disarm | 0));
    return 0;
  }
  P.stReport = function(st, raid) {
    if (!st || !raid || raid.id == null || st.lastId === raid.id || raid.b === "train") return [];
    stFix(st);
    st.lastId = raid.id;
    const fin = [];
    if (raid.b === "heli" && raid.win && st.res && typeof st.res.cur === "string" && raid.pax === st.res.cur) {
      const w = st.res.cur;
      rsFix(st);
      if (st.res.out.indexOf(w) < 0) st.res.out.push(w);
      st.res.cur = null;
      fin.push("res:" + w);
    }
    if (P.bnOpen(st)) {
      const B = bnFix(st);
      for (const c of P.bnList(st)) {
        const add = stAdd(c.obj, raid);
        if (!add || c.p >= c.need) continue;
        B.p[c.slot] = Math.min(c.need, c.p + add);
        if (B.p[c.slot] >= c.need) fin.push("bn:" + c.slot);
      }
    }
    for (const id of Object.keys(st.act)) {
      const m = P.stById(id);
      if (!m) continue;
      const add = stAdd(m.obj, raid);
      if (!add) continue;
      const need = P.stNeed(m), before = st.act[id].p | 0;
      st.act[id].p = Math.min(need, before + add);
      if (before < need && st.act[id].p >= need) fin.push(id);
    }
    return fin;
  };
  P.stPreview = function(st, raid) {
    if (!st || !st.act || !raid || raid.b === "train") return [];
    const out = [];
    for (const id of Object.keys(st.act)) {
      const m = P.stById(id);
      if (!m) continue;
      const add = stAdd(m.obj, raid);
      if (!add) continue;
      const need = P.stNeed(m), before = st.act[id].p | 0;
      if (before < need) out.push({
        m,
        before,
        add: Math.min(need, before + add) - before
      });
    }
    return out;
  };
  P.stSpawns = function(st, b) {
    const out = [];
    for (const m of P.STORY) {
      if (P.stDone(st, m.id)) continue;
      if (P.stActive(st, m.id)) {
        if (m.obj.kind === "find" && m.obj.b === b) out.push({
          item: m.obj.item,
          id: m.id,
          lead: false,
          up: !!m.obj.up
        });
      } else if (m.lead && m.lead.b === b && P.stOpen(st, m)) out.push({
        item: m.lead.item,
        id: m.id,
        lead: true
      });
    }
    return out;
  };
  P.stFor = function(st, who, h) {
    const r = {
      claim: null,
      accept: null,
      wait: null
    }, cnt = n => h && h.count ? h.count(n) : 0;
    for (const m of P.STORY) {
      if (m.who !== who || P.stDone(st, m.id)) continue;
      if (P.stActive(st, m.id)) {
        if (P.stReady(st, m, h)) {
          if (!r.claim) r.claim = m;
        } else if (!r.wait) r.wait = m;
      } else if (P.stOpen(st, m) && (!m.lead || cnt(m.lead.item) > 0) && !r.accept) r.accept = m;
    }
    return r;
  };
  P.stNow = function(st, h) {
    for (const m of P.stMainFor(st)) {
      if (P.stDone(st, m.id)) continue;
      if (P.stActive(st, m.id)) return {
        m,
        state: P.stReady(st, m, h) ? "claim" : "wait"
      };
      return {
        m,
        state: "accept"
      };
    }
    return P.stPickOpen(st) ? {
      m: P.PICK,
      state: "pick"
    } : null;
  };
  P.RS_INTRO = [ "", "", "" ];
  P.RS_DONE = [ "", "", "" ];
  P.RESCUE = [ {
    who: "student",
    need: [ "s5", "s18" ],
    gift: [ "트로피" ],
    ask: [ "", "" ],
    bye: [ "", "" ]
  }, {
    who: "clerk",
    need: [ "s6", "s21" ],
    money: 3e6,
    gift: [ "화투 한 목" ],
    ask: [ "", "" ],
    bye: [ "", "" ]
  }, {
    who: "courier",
    need: [ "s2", "s23" ],
    gift: [ "열쇠 꾸러미" ],
    ask: [ "", "" ],
    bye: [ "", "" ]
  }, {
    who: "nurse",
    need: [ "s10", "s25" ],
    gift: [ "구급킷", "구급킷", "항생제" ],
    ask: [ "", "" ],
    bye: [ "", "" ]
  }, {
    who: "foreman",
    need: [ "s1", "s12" ],
    gift: [ "무전기" ],
    ask: [ "", "" ],
    bye: [ "", "" ]
  }, {
    who: "taxi",
    need: [ "s11" ],
    gift: [ "기름 라이터" ],
    ask: [ "", "" ],
    bye: [ "", "" ]
  }, {
    who: "grad",
    need: [ "s9" ],
    gift: [ "태블릿", "증상 억제약" ],
    ask: [ "", "" ],
    bye: [ "", "" ]
  }, {
    who: "teacher",
    need: [ "s16" ],
    gift: [ "만년필" ],
    ask: [ "", "" ],
    bye: [ "", "" ]
  }, {
    who: "metro",
    need: [ "s22" ],
    gift: [ "액자" ],
    ask: [ "", "" ],
    bye: [ "", "" ]
  }, {
    who: "uncle",
    need: [ "s17" ],
    last: true,
    money: 1e7,
    gift: [ "금두꺼비", "산삼 뿌리" ],
    ask: [ "", "", "" ],
    bye: [ "", "", "" ]
  } ];
  P.RS_FEE0 = 12e6;
  P.RS_FEE_UP = 2e6;
  P.rsBy = who => P.RESCUE.find(r => r.who === who) || null;
  const rsFix = st => {
    if (!st.res || typeof st.res !== "object") st.res = {
      out: [],
      cur: null,
      got: []
    };
    if (!Array.isArray(st.res.out)) st.res.out = [];
    if (!Array.isArray(st.res.got)) st.res.got = [];
    if (typeof st.res.cur !== "string") st.res.cur = null;
    return st.res;
  };
  P.rsOf = st => st && st.res && Array.isArray(st.res.out) ? {
    out: st.res.out,
    cur: typeof st.res.cur === "string" ? st.res.cur : null,
    got: Array.isArray(st.res.got) ? st.res.got : []
  } : {
    out: [],
    cur: null,
    got: []
  };
  P.rsOpen = (st, data) => P.stMainDone(st) && ((data && data.eg && data.eg.won) | 0) >= 1;
  P.rsOut = (st, who) => P.rsOf(st).out.indexOf(who) >= 0;
  P.rsFee = st => P.RS_FEE0 + P.RS_FEE_UP * P.rsOf(st).out.length;
  P.rsAllOut = st => P.RESCUE.every(r => P.rsOut(st, r.who));
  P.rsLack = function(st, who) {
    const r = P.rsBy(who), out = [];
    if (!r) return [ "내보낼 수 없는 사람" ];
    const left = r.need.filter(id => !P.stDone(st, id)).length;
    if (left) out.push("이 사람의 부탁이 " + left + "가지 남았습니다 — 먼저 들어 주십시오");
    if (r.last && P.RESCUE.some(q => !q.last && !P.rsOut(st, q.who))) out.push("다른 사람들을 먼저 내보내 주십시오");
    return out;
  };
  P.rsState = function(st, data, who) {
    if (!P.rsBy(who)) return "closed";
    if (P.rsOut(st, who)) return "out";
    if (!P.rsOpen(st, data)) return "closed";
    if (P.rsOf(st).cur === who) return "cur";
    return P.rsLack(st, who).length ? "lack" : "ready";
  };
  P.rsPick = function(st, data, who) {
    stFix(st);
    const res = rsFix(st), r = P.rsBy(who), name = P.ST_WHO[who] || who;
    if (!r) return {
      ok: false,
      msg: "내보낼 수 없는 사람"
    };
    if (!P.rsOpen(st, data)) return {
      ok: false,
      msg: "아직 이릅니다 — 서울을 한 번 떠난 뒤에"
    };
    if (P.rsOut(st, who)) return {
      ok: false,
      msg: "이미 내보낸 사람"
    };
    if (res.cur === who) return {
      ok: false,
      msg: "이미 태우기로 했습니다 — 여의도 헬기장으로"
    };
    if (res.cur) return {
      ok: false,
      msg: "이미 " + (P.ST_WHO[res.cur] || res.cur) + " 을(를) 태우기로 했습니다 — 한 번에 한 사람"
    };
    const lack = P.rsLack(st, who);
    if (lack.length) return {
      ok: false,
      msg: lack[0]
    };
    const fee = P.rsFee(st);
    if ((+data.money || 0) < fee) return {
      ok: false,
      msg: "돈이 모자랍니다 — 자리값 " + won(fee)
    };
    data.money = Math.round((+data.money || 0) - fee);
    res.cur = who;
    return {
      ok: true,
      picked: who,
      fee,
      msg: "🚁 " + name + " 을(를) 다음 헬기에 태우기로 했습니다 — 여의도 헬기장에 출격하면 따라옵니다. 살려서 같이 타십시오"
    };
  };
  P.rsGift = function(st, data, who, h) {
    stFix(st);
    const res = rsFix(st), r = P.rsBy(who), name = P.ST_WHO[who] || who;
    if (!r || !P.rsOut(st, who)) return {
      ok: false,
      msg: "아직 내보내지 않은 사람"
    };
    if (res.got.indexOf(who) >= 0) return {
      ok: false,
      msg: "이미 받았습니다"
    };
    const give = (r.gift || []).slice();
    if (give.length && h && h.room && !h.room(give)) return {
      ok: false,
      msg: "보관함에 넣을 자리가 없습니다(" + give.length + "칸)"
    };
    if (r.money) data.money = Math.max(0, Math.round((+data.money || 0) + r.money));
    const got = [];
    for (const n of give) if (h && h.give(n)) got.push(n);
    res.got.push(who);
    const parts = [];
    if (r.money) parts.push(won(r.money));
    if (got.length) parts.push(got.join(", "));
    return {
      ok: true,
      gift: who,
      got,
      money: r.money || 0,
      msg: "🎁 " + name + " 이(가) 남기고 간 것 — " + parts.join(" + ")
    };
  };
  P.BN_SLOTS = 3;
  P.BN_SKIP = 3e5;
  P.NO_BOSS = {
    villa: 1
  };
  const BN_B = [ "villa", "office", "school", "mall", "metro", "bridge", "tunnel", "site", "hos", "base" ];
  const BN_BASE = [ 3e5, 5e5, 8e5, 12e5 ];
  const BN_BONUS = [ "상급 파츠 상자", "구급킷", "상급 파츠 상자", "증상 억제약" ];
  function bnRnd(i, k) {
    let h = 2166136261 >>> 0;
    const s = "bn" + i + ":" + k;
    for (let c = 0; c < s.length; c++) {
      h ^= s.charCodeAt(c);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return function() {
      h = h + 1831565813 >>> 0;
      let t = h;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  P.bnGen = function(i, k) {
    i = i | 0;
    k = k | 0;
    const r = bnRnd(i, k), pick = a => a[Math.floor(r() * a.length)], b = pick(BN_B), tier = P.ST_TIER[b] || 0, bn = P.B_NAMES[b] || b;
    let kd = pick(i === 0 ? [ "scav", "scav", "boss", "named" ] : i === 1 ? [ "extract", "night", "gain", "extract" ] : [ "zombie", "zombie", "search", "disarm" ]);
    if (P.NO_BOSS[b] && (kd === "boss" || kd === "named")) kd = "scav";
    let obj, mul = 1, name, brief, base = BN_BASE[tier];
    if (kd === "scav") {
      const n = 8 + Math.floor(r() * 4) * 2 + tier * 2;
      obj = {
        kind: "kill",
        what: "scav",
        b,
        n
      };
      name = "약탈자 소탕";
      brief = bn + "에서 약탈자 " + n + "명을 쓰러뜨려 주십시오";
    } else if (kd === "boss") {
      obj = {
        kind: "kill",
        what: "boss",
        b,
        n: 1
      };
      mul = 1.5;
      name = "두목 사냥";
      brief = bn + "의 약탈자 두목을 쓰러뜨려 주십시오";
    } else if (kd === "named") {
      obj = {
        kind: "named",
        b,
        n: 1
      };
      mul = 2.2;
      name = "이름난 목";
      brief = bn + "의 이름난 두목을 쓰러뜨려 주십시오(판마다 있는 것은 아닙니다 — 들어갈 때 소문이 뜹니다)";
    } else if (kd === "extract") {
      obj = {
        kind: "extract",
        b,
        n: 2
      };
      name = "정찰";
      brief = bn + "에 들어갔다가 두 번 살아서 나와 주십시오 (옥상 집라인·완강기 · 야외 지도는 끝 출구로 나와야 셉니다)";
    } else if (kd === "night") {
      obj = {
        kind: "extract",
        b,
        night: true,
        n: 1
      };
      mul = 1.3;
      name = "밤 정찰";
      brief = "밤에 " + bn + "에 들어갔다가 살아서 나와 주십시오 (옥상 집라인·완강기 · 야외 지도는 끝 출구로 나와야 셉니다)";
    } else if (kd === "gain") {
      const v = [ 5e5, 8e5, 12e5, 18e5 ][Math.floor(r() * 4)];
      obj = {
        kind: "gain",
        v,
        n: 1
      };
      base = Math.round(v * .6);
      name = "큰 벌이";
      brief = "한 판에 " + won(v) + "어치 넘게 들고 탈출해 주십시오(어느 건물이든)";
    } else if (kd === "zombie") {
      const n = 15 + Math.floor(r() * 4) * 5 + tier * 5;
      obj = {
        kind: "kill",
        what: "zombie",
        b,
        n
      };
      name = "감염체 청소";
      brief = bn + "에서 감염체 " + n + "마리를 쓰러뜨려 주십시오";
    } else if (kd === "search") {
      const n = 25 + Math.floor(r() * 4) * 5;
      obj = {
        kind: "search",
        n
      };
      base = 4e5 + n * 6e3;
      name = "수색";
      brief = "상자 " + n + "개를 끝까지 뒤져 주십시오(어느 건물이든)";
    } else {
      const n = 3 + Math.floor(r() * 3);
      obj = {
        kind: "disarm",
        n
      };
      base = 3e5 + n * 12e4;
      name = "함정 치우기";
      brief = "함정 " + n + "개를 풀어 주십시오(어느 건물이든)";
    }
    return {
      id: "bn:" + i,
      slot: i,
      k,
      obj,
      name,
      brief,
      money: Math.round(base * mul / 5e4) * 5e4
    };
  };
  const bnFix = st => {
    if (!st.bn || typeof st.bn !== "object") st.bn = {
      k: [],
      p: [],
      n: 0
    };
    const B = st.bn;
    if (!Array.isArray(B.k)) B.k = [];
    if (!Array.isArray(B.p)) B.p = [];
    for (let i = 0; i < P.BN_SLOTS; i++) {
      B.k[i] = Math.max(0, B.k[i] | 0);
      B.p[i] = Math.max(0, B.p[i] | 0);
    }
    B.k.length = P.BN_SLOTS;
    B.p.length = P.BN_SLOTS;
    B.n = Math.max(0, B.n | 0);
    return B;
  };
  P.bnOpen = st => P.stMainDone(st);
  P.bnList = function(st) {
    const B = st && st.bn && typeof st.bn === "object" ? st.bn : {}, out = [];
    for (let i = 0; i < P.BN_SLOTS; i++) {
      const c = P.bnGen(i, (B.k && B.k[i]) | 0), need = P.stNeed(c), p = Math.min(need, Math.max(0, (B.p && B.p[i]) | 0));
      out.push(Object.assign(c, {
        p,
        need,
        ready: p >= need
      }));
    }
    return out;
  };
  P.bnCount = st => (st && st.bn && st.bn.n) | 0;
  P.bnBonus = n => n > 0 && n % 5 === 0 ? BN_BONUS[(n / 5 - 1) % BN_BONUS.length] : null;
  P.bnPreview = function(st, raid) {
    if (!st || !raid || raid.b === "train" || !P.bnOpen(st)) return [];
    const out = [];
    for (const c of P.bnList(st)) {
      const add = stAdd(c.obj, raid);
      if (add && c.p < c.need) out.push({
        c,
        before: c.p,
        add: Math.min(c.need, c.p + add) - c.p
      });
    }
    return out;
  };
  P.bnAct = function(st, data, slot, what, h) {
    stFix(st);
    if (!P.bnOpen(st)) return {
      ok: false,
      msg: "아직 이릅니다 — 현상금 게시판은 장터 사람들의 이야기를 끝낸 뒤에"
    };
    const i = slot | 0;
    if (!(i >= 0 && i < P.BN_SLOTS) || String(slot) !== String(i)) return {
      ok: false,
      msg: "없는 현상금"
    };
    const B = bnFix(st), c = P.bnList(st)[i];
    if (what === "skip") {
      if ((+data.money || 0) < P.BN_SKIP) return {
        ok: false,
        msg: "돈이 모자랍니다 — 바꾸는 값 " + won(P.BN_SKIP)
      };
      data.money = Math.round((+data.money || 0) - P.BN_SKIP);
      B.k[i]++;
      B.p[i] = 0;
      return {
        ok: true,
        skipped: i,
        msg: "📌 현상금 「" + c.name + "」을(를) 떼고 새 것을 붙였습니다 — " + won(P.BN_SKIP)
      };
    }
    if (what !== "claim") return {
      ok: false,
      msg: "없는 일"
    };
    if (!c.ready) return {
      ok: false,
      msg: "아직 다 못 했습니다 — " + c.p + "/" + c.need
    };
    const bonus = P.bnBonus(B.n + 1);
    if (bonus && h && h.room && !h.room([ bonus ])) return {
      ok: false,
      msg: "보관함에 덤 넣을 자리가 없습니다(1칸)"
    };
    data.money = Math.max(0, Math.round((+data.money || 0) + c.money));
    const got = bonus && h && h.give(bonus) ? bonus : null;
    B.k[i]++;
    B.p[i] = 0;
    B.n++;
    return {
      ok: true,
      claimed: i,
      money: c.money,
      bonus: got,
      n: B.n,
      msg: "💰 현상금 「" + c.name + "」 — " + won(c.money) + (got ? " + 덤 " + got : "") + " · 지금까지 " + B.n + "건"
    };
  };
  const stRewards = m => (m.items || []).slice();
  P.stAccept = function(st, data, id, h) {
    const m = P.stById(id);
    if (!m) return {
      ok: false,
      msg: "없는 임무"
    };
    stFix(st);
    if (P.stDone(st, id)) return {
      ok: false,
      msg: "이미 끝낸 임무"
    };
    if (P.stActive(st, id)) return {
      ok: false,
      msg: "이미 맡은 임무"
    };
    if (m.pick && P.stSide(st)) return {
      ok: false,
      msg: "이미 다른 편을 들었습니다"
    };
    if (!P.stOpen(st, m)) return {
      ok: false,
      msg: "아직 맡을 수 없는 임무"
    };
    if (m.pick) return stPick(st, data, m, h);
    if (m.lead && !(h.count(m.lead.item) > 0)) return {
      ok: false,
      msg: m.lead.item + " 이(가) 있어야 합니다"
    };
    if (m.obj.kind === "talk") {
      st.act[id] = {
        p: 1
      };
      return P.stClaim(st, data, id, h);
    }
    if (m.lead && !h.take(m.lead.item)) return {
      ok: false,
      msg: m.lead.item + " 이(가) 없습니다"
    };
    st.act[id] = {
      p: 0
    };
    return {
      ok: true,
      accepted: true,
      id,
      msg: "★ 임무 「" + m.name + "」 — " + m.brief
    };
  };
  P.stClaim = function(st, data, id, h) {
    const m = P.stById(id);
    if (!m) return {
      ok: false,
      msg: "없는 임무"
    };
    stFix(st);
    if (!P.stActive(st, id)) return {
      ok: false,
      msg: P.stDone(st, id) ? "이미 끝낸 임무" : "아직 맡지 않은 임무"
    };
    if (!P.stReady(st, m, h)) return {
      ok: false,
      msg: "아직 다 못 했습니다 — " + P.stProg(st, m, h) + "/" + P.stNeed(m)
    };
    const give = stRewards(m);
    if (give.length && h.room && !h.room(give)) return {
      ok: false,
      msg: "보관함에 보상 넣을 자리가 없습니다(" + give.length + "칸)"
    };
    const o = m.obj, back = P.keepAll(data);
    const takes = o.kind === "find" ? [ [ o.item, 1 ] ] : o.kind === "fetch" ? o.items : [];
    for (const [n, c] of takes) for (let i = 0; i < c; i++) if (!h.take(n)) {
      back();
      return {
        ok: false,
        msg: n + " 이(가) 모자랍니다"
      };
    }
    if (m.money) data.money = Math.max(0, Math.round((+data.money || 0) + m.money));
    const got = [];
    for (const n of give) if (h.give(n)) got.push(n);
    delete st.act[id];
    st.done.push(id);
    const parts = [];
    if (m.money) parts.push(won(m.money));
    if (got.length) parts.push(got.join(", "));
    return {
      ok: true,
      claimed: true,
      id,
      unlock: m.unlock || null,
      got,
      money: m.money || 0,
      msg: "★ 임무 「" + m.name + "」 완료" + (parts.length ? " — " + parts.join(" + ") : "") + (m.unlock ? " · 도심 지도에 " + (P.B_NAMES[m.unlock] || m.unlock) + " 이(가) 열렸습니다" : "")
    };
  };
  P.stAct = function(st, data, id, what, h) {
    if (String(id).indexOf("bn:") === 0) return P.bnAct(st, data, String(id).slice(3), what, h);
    if (String(id).indexOf("res:") === 0) {
      const w = String(id).slice(4);
      return what === "pick" ? P.rsPick(st, data, w) : what === "gift" ? P.rsGift(st, data, w, h) : {
        ok: false,
        msg: "없는 일"
      };
    }
    return what === "accept" ? P.stAccept(st, data, id, h) : what === "claim" ? P.stClaim(st, data, id, h) : {
      ok: false,
      msg: "없는 일"
    };
  };
  P.NG_MAX = 4;
  P.ngB = ng => Math.max(0, Math.min(P.NG_MAX, ng | 0));
  P.ngRows = ng => 2 * P.ngB(ng);
  P.ngXp = ng => 1 + .1 * P.ngB(ng);
  P.ngOk = eg => ((eg && eg.won) | 0) >= 1;
  P.NG_KEEP = [ "look", "title", "rec", "eggs", "body", "fights", "runs", "extracts", "deaths", "kills", "playedMs", "tut", "tutc", "markers", "gift0920", "gift0924", "gift0930", "trainDay", "trainN", "lastRaid", "daily", "wt", "ngLog", "ends" ];
  P.NG_START = {
    money: 3e5,
    stash: [ "9mm 탄창", "9mm 탄창", "붕대", "진통제" ],
    kit: {
      w1: "사제 파이프 권총",
      melee: "식칼",
      bag: "천 가방",
      rig: "기본 리그"
    },
    rig: [ [ "9mm 탄창", 12 ], [ "붕대", null ] ]
  };
  function gridPut(g, it) {
    const sz = o => o.rot ? [ o.h || 1, o.w || 1 ] : [ o.w || 1, o.h || 1 ];
    for (const rot of [ 0, 1 ]) {
      const w = rot ? it.h || 1 : it.w || 1, h = rot ? it.w || 1 : it.h || 1;
      if (rot && w === h) continue;
      for (let y = 0; y + h <= g.rows; y++) for (let x = 0; x + w <= g.cols; x++) {
        if (g.list.some(e => {
          const [ew, eh] = sz(e.it);
          return x < e.x + ew && x + w > e.x && y < e.y + eh && y + h > e.y;
        })) continue;
        it.rot = !!rot;
        g.list.push({
          x,
          y,
          it
        });
        return {
          x,
          y
        };
      }
    }
    return null;
  }
  P.ngFresh = function(old, ng, mk, home) {
    const o = {
      v: 1
    };
    for (const k of P.NG_KEEP) if (old && Object.prototype.hasOwnProperty.call(old, k) && old[k] !== undefined) o[k] = JSON.parse(JSON.stringify(old[k]));
    o.gift0920 = true;
    o.gift0930 = true;
    o.ng = ng | 0;
    o.money = P.NG_START.money;
    o.infect = 0;
    o.insured = false;
    o.intel = null;
    o.merc = null;
    o.nap = 0;
    o.skill = {};
    o.stash = {
      cols: 10,
      rows: 6 + P.ngRows(ng),
      list: []
    };
    for (const n of P.NG_START.stash) {
      const it = mk(n);
      if (it) gridPut(o.stash, it);
    }
    const K = P.NG_START.kit, kit = {
      w1: mk(K.w1),
      w2: null,
      melee: mk(K.melee),
      armor: null,
      helmet: null,
      bag: mk(K.bag),
      rig: mk(K.rig),
      quick: new Array(10).fill(null)
    };
    if (kit.w1) delete kit.w1.ammo;
    if (kit.rig) {
      if (!kit.rig.grid) kit.rig.grid = {
        cols: kit.rig.cols || 1,
        rows: kit.rig.rows || 1,
        list: []
      };
      for (const [n, ammo] of P.NG_START.rig) {
        const it = mk(n);
        if (!it) continue;
        if (ammo != null) it.ammo = ammo;
        const at = gridPut(kit.rig.grid, it);
        if (at && it.kind !== "mag" && !kit.quick[0]) kit.quick[0] = {
          c: "rig",
          x: at.x,
          y: at.y
        };
      }
    }
    o.kit = kit;
    o.home = home ? JSON.parse(JSON.stringify(home)) : null;
    o.safe = {
      ext: []
    };
    o.quests = P.qNew();
    o.fac = P.fNew();
    o.story = P.stNew();
    o.eg = P.egNew();
    return o;
  };
  P.wipeFresh = function(old, n, mk, home) {
    const ng = (old && old.ng) | 0, o = P.ngFresh(old, ng, mk, home);
    if (!(ng > 0)) delete o.ng;
    if (o.kit && o.kit.w1) {
      const g = mk(P.NG_START.kit.w1);
      if (g) o.kit.w1 = g;
    }
    o.wipeN = Math.max(0, n | 0);
    o.garden = P.gNew();
    return o;
  };
  P.WK_TIER = [ {
    name: "쉬움",
    pt: 100
  }, {
    name: "보통",
    pt: 150
  }, {
    name: "어려움",
    pt: 200
  } ];
  P.WK_POOL = [ {
    id: "wc1",
    tier: 0,
    name: "약탈자 사냥",
    desc: "약탈자 쓰러뜨리기",
    k: "kS",
    star: [ 10, 20, 30 ]
  }, {
    id: "wc2",
    tier: 0,
    name: "방역",
    desc: "감염체 쓰러뜨리기",
    k: "kZ",
    star: [ 20, 40, 70 ]
  }, {
    id: "wc3",
    tier: 0,
    name: "살아 돌아오기",
    desc: "어느 건물이든 살아서 나오기(옥상 집라인·완강기 · 야외 지도는 끝 출구)",
    k: "ext",
    star: [ 3, 6, 10 ]
  }, {
    id: "wc4",
    tier: 0,
    name: "알뜰 수집",
    desc: "살아서 나온 판에 들고 나온 값 모으기",
    k: "gain",
    star: [ 1e6, 3e6, 6e6 ],
    won: true
  }, {
    id: "wc5",
    tier: 1,
    name: "명사수",
    desc: "치명타(머리) 맞히기",
    k: "crit",
    star: [ 10, 20, 30 ]
  }, {
    id: "wc6",
    tier: 1,
    name: "번쩍",
    desc: "섬광탄으로 적 기절시키기",
    k: "flash",
    star: [ 4, 7, 10 ]
  }, {
    id: "wc7",
    tier: 1,
    name: "짐꾼",
    desc: "20kg 넘게 들고 살아서 나오기",
    k: "heavy",
    star: [ 1, 3, 5 ]
  }, {
    id: "wc8",
    tier: 1,
    name: "하교 시간",
    desc: "고등학교에서 살아서 나오기(옥상 집라인·완강기)",
    k: "ext",
    b: "school",
    star: [ 2, 4, 5 ]
  }, {
    id: "wc9",
    tier: 2,
    name: "옥상의 주인",
    desc: "옥상 약탈자 두목 쓰러뜨리기",
    k: "kB",
    star: [ 1, 2, 3 ]
  }, {
    id: "wc10",
    tier: 2,
    name: "이름난 사냥꾼",
    desc: "건물 전용 두목 쓰러뜨리기",
    k: "kN",
    star: [ 1, 2, 3 ]
  }, {
    id: "wc11",
    tier: 2,
    name: "험한 곳",
    desc: "상가·병원·터미널·군부대에서 살아서 나오기(옥상 집라인·완강기)",
    k: "ext",
    b: "*hard",
    star: [ 1, 3, 5 ]
  }, {
    id: "wc12",
    tier: 2,
    name: "큰 건",
    desc: "한 판에 300만 원어치 넘게 들고 나오기",
    k: "big",
    star: [ 1, 2, 3 ]
  } ];
  P.WK_KG = 20;
  P.WK_BIG = 3e6;
  const WK_MAX = {
    kS: 120,
    kZ: 150,
    kB: 1,
    kN: 1,
    ext: 1,
    crit: 400,
    flash: 60,
    heavy: 1,
    gain: 2e7,
    big: 1
  };
  P.wcById = id => P.WK_POOL.find(c => c.id === id) || null;
  P.wkListOf = wk => [ 0, 1, 2 ].map(t => pickN(P.WK_POOL.filter(c => c.tier === t), 1, (wk | 0) * 7349 + 101 * (t + 1))[0]);
  P.wkList = now => P.wkListOf(P.weekKey(now));
  P.wkStart = wk => ((wk | 0) * 7 - 3) * DAYMS - KST;
  P.wkAmt = function(c, m) {
    if (!c || !m) return 0;
    if (c.b && !(c.b === "*hard" ? HARD.indexOf(m.b) >= 0 : c.b === m.b)) return 0;
    const v = Math.max(0, +m[c.k] || 0);
    return Math.min(WK_MAX[c.k] || 1, c.won ? Math.round(v) : Math.floor(v));
  };
  P.wkStars = (c, n) => c ? c.star.filter(s => (n || 0) >= s).length : 0;
  P.wkPts = (list, prog) => list.reduce((t, c) => t + P.wkStars(c, (prog || {})[c.id]) * P.WK_TIER[c.tier].pt, 0);
  P.wkStarSum = (list, prog) => list.reduce((t, c) => t + P.wkStars(c, (prog || {})[c.id]), 0);
  P.wkApply = function(list, prog, m) {
    const out = [];
    for (const c of list) {
      const add = P.wkAmt(c, m);
      if (!add) continue;
      const before = prog[c.id] || 0;
      prog[c.id] = before + add;
      out.push({
        c,
        add,
        before
      });
    }
    return out;
  };
  P.WK_STAR_WON = 2e5;
  P.wkReward = function(stars, rank) {
    const r = rank | 0, money = P.WK_STAR_WON * (stars | 0) + (r === 1 ? 3e6 : r >= 2 && r <= 3 ? 15e5 : r >= 4 && r <= 10 ? 5e5 : 0);
    return {
      money,
      title: r === 1 ? "주간 도전 1위" : r >= 2 && r <= 3 ? "주간 도전 입상" : r >= 4 && r <= 10 ? "주간 도전 상위 10" : null
    };
  };
  function won(n) {
    return "₩" + Math.round(n).toLocaleString("ko-KR");
  }
  P.MIS = {
    escort: 1,
    hold: 1,
    stealth: 1,
    power: 1,
    photo: 1
  };
  P.MIS_Q = [ {
    after: "g2",
    id: "xh1",
    t: "gun",
    name: "",
    kind: "hold",
    b: "office",
    n: 1,
    money: 18e5,
    desc: ""
  }, {
    after: "a2",
    id: "xp2",
    t: "ammo",
    name: "",
    kind: "power",
    b: "office",
    n: 1,
    money: 13e5,
    desc: ""
  }, {
    after: "m2",
    id: "xe1",
    t: "med",
    name: "",
    kind: "escort",
    b: "mall",
    who: "",
    n: 1,
    money: 18e5,
    desc: ""
  }, {
    after: "m3",
    id: "xc1",
    t: "med",
    name: "",
    kind: "photo",
    b: "hos",
    spot: "영안실",
    n: 1,
    money: 35e5,
    desc: ""
  }, {
    after: "r2",
    id: "xs1",
    t: "gear",
    name: "",
    kind: "stealth",
    b: "villa",
    n: 1,
    money: 16e5,
    desc: ""
  }, {
    after: "s2",
    id: "xs2",
    t: "teacher",
    name: "",
    kind: "stealth",
    b: "school",
    n: 1,
    money: 18e5,
    desc: ""
  }, {
    after: "t2",
    id: "xp1",
    t: "metro",
    name: "",
    kind: "power",
    b: "metro",
    n: 1,
    money: 28e5,
    desc: ""
  }, {
    after: "t3",
    id: "xc2",
    t: "metro",
    name: "",
    kind: "photo",
    b: "metro",
    spot: "전광판",
    n: 1,
    money: 35e5,
    desc: ""
  }, {
    after: "v2",
    id: "xe2",
    t: "vet",
    name: "",
    kind: "escort",
    b: "base",
    who: "",
    n: 1,
    money: 55e5,
    desc: ""
  }, {
    after: "v3",
    id: "xh2",
    t: "vet",
    name: "",
    kind: "hold",
    b: "base",
    n: 1,
    money: 7e6,
    desc: ""
  } ];
  for (const m of P.MIS_Q) {
    if (P.QUESTS.some(q => q.id === m.id)) continue;
    const q = Object.assign({}, m);
    delete q.after;
    const i = P.QUESTS.findIndex(x => x.id === m.after);
    if (i < 0) P.QUESTS.push(q); else P.QUESTS.splice(i + 1, 0, q);
  }
  P.misAdd = (q, raid) => P.MIS[q.kind] && raid && raid.win && raid.b === q.b && Array.isArray(raid.mis) && raid.mis.indexOf(q.id) >= 0 ? 1 : 0;
  P.misWhat = function(q) {
    const b = P.B_NAMES && P.B_NAMES[q.b] || q.b;
    return q.kind === "escort" ? b + " · " + q.who + " 데리고 탈출" : q.kind === "hold" ? b + " 꼭대기 층 · 무전 중계기 1분 지키고 탈출" : q.kind === "stealth" ? b + " · 들키지 않고 탈출" : q.kind === "power" ? b + " · 발전기 켜고 승강기 타고 탈출" : q.kind === "photo" ? b + " · " + q.spot + " 사진 찍고 탈출" : b;
  };
  P.misClean = function(lr, po, secs) {
    if (!lr || lr.mis == null) return;
    if (!po || lr.id !== po.seed || lr.b !== po.b || !lr.win || !Array.isArray(lr.mis)) {
      delete lr.mis;
      return;
    }
    const ok = [];
    for (const id of lr.mis.slice(0, 10)) {
      const q = typeof id === "string" ? P.QUESTS.find(x => x.id === id) : null;
      if (!q || !P.MIS[q.kind] || q.b !== lr.b || ok.indexOf(id) >= 0) continue;
      if (q.kind === "hold" && secs >= 0 && secs < 60) continue;
      if (q.kind === "power" && secs >= 0 && secs < 12) continue;
      ok.push(id);
    }
    if (ok.length) lr.mis = ok; else delete lr.mis;
  };
  root.SX_PROG = P;
  if (root.SX) root.SX.prog = P;
})(typeof window !== "undefined" ? window : globalThis);
