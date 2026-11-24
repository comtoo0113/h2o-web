"use strict";

(function(SX) {
  const RC = SX.recap = {
    hits: [],
    tot: {},
    MAX: 400,
    tDead: null,
    why: null,
    pic: null,
    picW: 0,
    picH: 0,
    picN: 0,
    gen: 0,
    picGot: 0,
    picPend: false,
    sum: null
  };
  const ENV = {
    bleed: "출혈",
    inf: "상처 감염",
    gas: "가스",
    hunger: "배고픔 · 목마름",
    smoke: "연기에 질식",
    fire: "불길",
    drown: "물에 잠겨 숨이 막힘"
  };
  RC.ENV = ENV;
  let S = null, ids = new WeakMap, nid = 0;
  RC.reset = function() {
    if (RC.pic) {
      try {
        URL.revokeObjectURL(RC.pic);
      } catch (e) {}
    }
    RC.hits = [];
    RC.tot = {};
    RC.tDead = null;
    RC.why = null;
    RC.pic = null;
    RC.picW = RC.picH = 0;
    RC.picN++;
    RC.gen++;
    RC.picGot = 0;
    RC.picPend = false;
    S = RC.sum = {
      n: 0,
      d: 0,
      ab: 0,
      head: 0,
      by: Object.create(null),
      per: Object.create(null)
    };
    ids = new WeakMap;
    nid = 0;
  };
  RC.reset();
  const now = () => +(SX.raid && SX.raid.t || 0);
  const r1 = v => Math.round((+v || 0) * 10) / 10;
  const ARW = [ "→", "↘", "↓", "↙", "←", "↖", "↑", "↗" ];
  RC.arrow = a => ARW[(Math.round(a / (Math.PI / 4)) % 8 + 8) % 8];
  function whoOf(m, cal) {
    if (!m) return {
      k: "unknown",
      n: "알 수 없음",
      w: null
    };
    if (m.trap === "bear") return {
      k: "trap",
      n: "곰덫",
      w: null
    };
    if (m.pvp) return {
      k: "player",
      n: m.pvp.name,
      w: m.w || null,
      g: m.pvp.gid,
      mt: !!m.pvp.mate
    };
    const b = m.by;
    if (!b) return {
      k: "unknown",
      n: "알 수 없음",
      w: m.w || null
    };
    if (b.trap) return {
      k: "trap",
      n: "인계철선",
      w: "수류탄"
    };
    if (b.kind === "player") return {
      k: "self",
      n: "나",
      w: m.nade ? "수류탄" : null
    };
    if (b.kind === "peer") return {
      k: "player",
      n: b.name || "다른 사람",
      w: m.nade ? "수류탄" : null,
      g: b.isAlly ? null : b.pid,
      mt: !!b.mate
    };
    if (b.kind !== "enemy") return {
      k: "unknown",
      n: b.name || "알 수 없음",
      w: null
    };
    const n = (b.boss || b.named) && b.name ? b.name : b.guard ? "두목 호위" : b.vname || (b.type === "zombie" ? "감염체" : "약탈자");
    const k = b.boss || b.named ? "boss" : b.type === "zombie" ? b.variant === "dog" ? "dog" : "zombie" : "raider";
    let w = m.nade ? "수류탄" : null;
    if (!w && cal === "melee") w = b.type === "zombie" ? b.variant === "dog" ? "이빨" : b.variant === "brute" ? "주먹" : "손톱 · 이빨" : b.melee && b.melee.name || "둔기";
    if (!w) w = b.gun || null;
    return {
      k,
      n,
      w
    };
  }
  RC.whoOf = whoOf;
  function oppOf(m) {
    if (!m) return null;
    if (m.trap) return "t" + m.trap;
    if (m.pvp) return "p" + m.pvp.gid;
    const b = m.by;
    if (!b || typeof b !== "object") return null;
    if (b.kind === "player") return "me";
    let id = ids.get(b);
    if (!id) {
      id = ++nid;
      ids.set(b, id);
    }
    return id;
  }
  function gearOf(b) {
    if (!b || typeof b !== "object" || b.kind !== "enemy" || b.type === "zombie") return null;
    const mx = +b.hpMax || +b.hp0 || 0;
    return {
      mods: (Array.isArray(b.gunMods) ? b.gunMods : []).filter(x => typeof x === "string" && x).slice(0, 6),
      helm: b.helmet ? 1 : 0,
      vest: b.hasArmor ? 1 : 0,
      ehp: mx > 0 ? Math.max(0, Math.min(100, Math.round(100 * Math.max(0, +b.hp || 0) / mx))) : null
    };
  }
  const injNew = (J0, J1) => [ "bleedH", "bleedL", "frac", "inf" ].filter(k => J1 && J1[k] && !(J0 && J0[k]));
  const SG = "12게이지";
  RC.hit = function(o) {
    const m = o.meta || null, w = whoOf(m, o.cal);
    const rec = {
      t: now(),
      k: w.k,
      n: w.n,
      w: w.w,
      cal: o.cal && o.cal !== "melee" && o.cal !== "blast" ? o.cal : null,
      at: "",
      part: o.leg ? "leg" : o.cal === "blast" ? "blast" : o.head ? "head" : "body",
      d0: r1(o.d0),
      d: r1(o.d),
      ab: r1(Math.max(0, (o.d0 || 0) - (o.d || 0))),
      inj: injNew(o.J0, o.J1),
      r: m && m.r != null && Number.isFinite(+m.r) ? Math.round(+m.r) : null,
      dir: o.ang == null || !Number.isFinite(+o.ang) ? null : RC.arrow(+o.ang + Math.PI),
      dead: !!o.dead
    };
    if (rec.cal && (o.at === "ap" || o.at === "hp")) rec.at = o.at;
    const e = oppOf(m);
    if (e != null) rec.e = e;
    if (o.down) rec.down = 1;
    const G = gearOf(m && m.by);
    if (G) {
      if (G.mods.length) rec.mods = G.mods;
      rec.helm = G.helm;
      rec.vest = G.vest;
      if (G.ehp != null) rec.ehp = G.ehp;
    }
    if (w.k === "player" && Number.isInteger(+w.g) && +w.g > 0) {
      rec.g = +w.g;
      if (w.mt) rec.mt = 1;
    }
    const key = e != null ? "e" + e : "n" + rec.n, P = S.per[key] || (S.per[key] = {
      n: 0,
      d: 0
    });
    S.d += rec.d;
    S.ab += rec.ab;
    P.d += rec.d;
    S.by[rec.n] = (S.by[rec.n] || 0) + rec.d;
    const L = RC.hits[RC.hits.length - 1];
    if (L && rec.cal === SG && rec.at !== "hp" && L.cal === SG && L.at === rec.at && L.e === rec.e && L.w === rec.w && L.part !== "blast" && rec.part !== "blast" && !L.down === !rec.down && rec.t - (L.t0 != null ? L.t0 : L.t) <= .08) {
      const hadHead = L.part === "head";
      if (!L.cnt) {
        L.cnt = 1;
        L.pc = {};
        L.pc[L.part] = 1;
        L.t0 = L.t;
      }
      L.cnt++;
      L.pc[rec.part] = (L.pc[rec.part] || 0) + 1;
      L.d0 = r1(L.d0 + rec.d0);
      L.d = r1(L.d + rec.d);
      L.ab = r1(L.ab + rec.ab);
      for (const k of rec.inj) if (!L.inj.includes(k)) L.inj.push(k);
      if (rec.dead) L.dead = true;
      L.t = rec.t;
      if (rec.r != null) L.r = rec.r;
      if (rec.dir) L.dir = rec.dir;
      if (rec.ehp != null) L.ehp = rec.ehp;
      if (rec.part === "head") L.part = "head";
      if (!hadHead && L.part === "head") S.head++;
      return L;
    }
    S.n++;
    P.n++;
    if (rec.part === "head") S.head++;
    RC.hits.push(rec);
    if (RC.hits.length > RC.MAX) RC.hits.shift();
    return rec;
  };
  RC.injAfter = function(rec, J0, J1) {
    if (rec) rec.inj = injNew(J0, J1);
  };
  RC.tick = function(k, v) {
    if (SX.game && SX.game.state === "raid" && v > 0) RC.tot[k] = (RC.tot[k] || 0) + v;
  };
  RC.snap = function() {
    const V = SX.view, c = V && V.ctx && V.ctx.canvas;
    if (!c || !(V.vw > 0) || !(V.vh > 0)) return false;
    const W = Math.min(V.vw, c.width) | 0, H = Math.min(V.vh, c.height) | 0;
    if (W < 4 || H < 4) return false;
    const w = Math.round(W / 2), h = Math.round(H / 2), p = SX.actors && SX.actors.player, TS = SX.TS || 32;
    let sx = (W - w) / 2, sy = (H - h) / 2;
    if (p && V.cam && Number.isFinite(+p.x) && Number.isFinite(+p.y)) {
      sx = p.x * TS - V.cam.x - w / 2;
      sy = (p.y - .5) * TS - V.cam.y - h / 2;
    }
    sx = Math.round(Math.max(0, Math.min(W - w, sx)));
    sy = Math.round(Math.max(0, Math.min(H - h, sy)));
    const cv = document.createElement("canvas");
    cv.width = w;
    cv.height = h;
    const x = cv.getContext("2d");
    if (!x || !cv.toBlob) return false;
    x.imageSmoothingEnabled = false;
    const scr = document.getElementById("screen");
    if (scr && scr.style.filter) x.filter = scr.style.filter;
    x.drawImage(c, sx, sy, w, h, 0, 0, w, h);
    const n = ++RC.picN, g = RC.gen;
    RC.picPend = true;
    RC.picW = w;
    RC.picH = h;
    cv.toBlob(b => {
      if (!b || g !== RC.gen || n < RC.picGot) return;
      RC.picGot = n;
      if (RC.pic) {
        try {
          URL.revokeObjectURL(RC.pic);
        } catch (e) {}
      }
      RC.pic = URL.createObjectURL(b);
      for (const im of document.querySelectorAll("img.rcPicImg")) if (im.dataset.g === String(g)) im.src = RC.pic;
    }, "image/png");
    return true;
  };
  RC.died = function(why) {
    if (RC.tDead != null) return;
    RC.tDead = now();
    RC.why = why || null;
    if (/포기/.test(why || "") || !(SX.game && SX.game.state === "raid")) return;
    try {
      RC.snap();
    } catch (e) {}
    const g = RC.gen;
    setTimeout(() => {
      if (RC.gen === g && RC.tDead != null && SX.game && SX.game.state === "raid") {
        try {
          RC.snap();
        } catch (e) {}
      }
    }, 450);
  };
  RC.summary = function(why) {
    why = RC.why || why || "";
    if (/포기/.test(why)) return null;
    const H = RC.hits;
    if (!H.length && !Object.keys(RC.tot).length) return null;
    const tEnd = RC.tDead != null ? RC.tDead : now(), ago = h => Math.max(0, r1(tEnd - h.t));
    const by = new Map;
    let env = 0;
    for (const n in S.by) by.set(n, S.by[n]);
    for (const k in RC.tot) {
      const n = ENV[k] || k;
      by.set(n, (by.get(n) || 0) + RC.tot[k]);
      env += RC.tot[k];
    }
    const tot = [ ...by.entries() ].map(([n, v]) => [ n, Math.round(v) ]).filter(q => q[1] > 0).sort((a, b) => b[1] - a[1]);
    const lastH = H[H.length - 1], kill = lastH && lastH.dead ? lastH : null;
    let cause = null;
    if (!kill) {
      const want = /피를/.test(why) ? [ "bleedH", "bleedL" ] : /곪/.test(why) ? [ "inf" ] : null;
      if (want) for (let i = H.length - 1; i >= 0; i--) if (H[i].inj.some(k => want.includes(k))) {
        cause = H[i];
        break;
      }
    }
    const pack = h => {
      if (!h) return null;
      const q = S.per[h.e != null ? "e" + h.e : "n" + h.n];
      return Object.assign({}, h, {
        ago: ago(h),
        opp: {
          n: q ? q.n : 1,
          d: Math.round(q ? q.d : h.d)
        }
      });
    };
    const last = H.map(h => Object.assign({}, h, {
      ago: ago(h)
    }));
    return {
      why,
      kill: pack(kill),
      cause: pack(cause),
      causeAgo: cause ? ago(cause) : null,
      last,
      n: S.n,
      tot,
      armor: Math.round(S.ab),
      dAll: Math.round(S.d + env),
      head: S.head,
      tDead: RC.tDead
    };
  };
  const PART = {
    head: "머리(헤드샷)",
    body: "몸",
    leg: "다리",
    blast: "폭발"
  };
  const INJ = k => ((SX.INJURIES || {})[k] || {}).name || k;
  const wpn = h => h.w || "-";
  const who = h => h.n + (h.k === "player" ? "(사람)" : "");
  const WHO_EN = {
    약탈자: "Raider"
  };
  const whoEn = h => h.k !== "player" && WHO_EN[h.n] ? ` data-en="${WHO_EN[h.n]}"` : "";
  const far = h => (h.r != null ? h.r + "m" : "-") + (h.dir ? " " + h.dir : "");
  const ammoH = (h, esc, short) => {
    if (!h.cal) return "-";
    const tg = short && SX.ammoTypeTag ? SX.ammoTypeTag(h.cal, h.at) || "Std" : "";
    return `<span>${esc(h.cal)}</span> <span${tg ? ` data-en="${esc(tg)}"` : ""}>${esc(SX.ammoTypeName ? SX.ammoTypeName(h.cal, h.at) : "보통탄")}</span>`;
  };
  const partH = (k, short) => `<span${short && k === "head" ? ` data-en="Head"` : ""}>${PART[k] || "-"}</span>`;
  const whereH = (h, short) => (h.pc ? [ "head", "body", "leg" ].filter(k => h.pc[k]).map(k => `<span class="rcNw">${partH(k, short)} ×${h.pc[k]}</span>`).join(" · ") : partH(h.part, short)) + (h.down ? ` <span class="dim">(쓰러진 채)</span>` : "");
  const injH = (h, esc) => h.inj && h.inj.length ? h.inj.map(k => `<span>${esc(INJ(k))}</span>`).join(" · ") : "-";
  const agoT = a => a < 60 ? `${a}초 전` : `${Math.floor(a / 60)}분 ${Math.round(a % 60)}초 전`;
  function card(h, esc) {
    const row = (k, v, en) => v ? `<tr><th${en ? ` data-en="${en}"` : ""}>${k}</th><td>${v}</td></tr>` : "";
    const gear = h.helm != null ? [ h.helm ? "방탄모" : "", h.vest ? "방탄조끼" : "" ].filter(Boolean).map(t => `<span>${t}</span>`).join(" · ") || `<span>없음</span>` : "";
    const q = h.opp || {
      n: 1,
      d: Math.round(h.d)
    };
    return `<table class="rcKT">${row("누구", `<b class="bad"${whoEn(h)}>${esc(who(h))}</b>`)}${row("무엇으로", `<span>${esc(wpn(h))}</span>`)}` + row("부착물", h.mods && h.mods.length ? h.mods.map(n => `<span>${esc(n)}</span>`).join(" · ") : "", "Mods") + row("탄", h.cal ? ammoH(h, esc) : "", "Ammo") + row("맞은 곳", whereH(h)) + row("거리", h.r != null || h.dir ? esc(far(h)) : "", "Range") + row("피해", `${h.d0} → <b class="bad">${h.d}</b>${h.ab ? ` <span class="good">방어구가 막은 피해 ${h.ab}</span>` : ""}`) + row("생긴 부상", h.inj && h.inj.length ? injH(h, esc) : "", "Wounds") + row("상대 장비", gear, "Gear") + row("상대 남은 체력", h.ehp != null ? h.ehp + "%" : "", "Their HP") + row("이 상대에게", `<span>${q.n}번 맞음</span> · <span>받은 피해 ${q.d}</span>`, "From them") + `</table>`;
  }
  RC.html = function(s) {
    if (!s) return "";
    const esc = SX.esc;
    const K = s.kill || s.cause;
    let top = "";
    if (s.kill) top = `<p class="rcTop"><b>마지막 한 방</b></p>`; else if (s.cause) top = `<p class="rcTop">${esc(s.why)} — 그 부상은 ${s.causeAgo}초 전에 맞아서 생겼습니다:</p>`; else if (s.why) top = `<p class="rcTop">${esc(s.why)}</p>`;
    const mine = RC.tDead != null && s.tDead === RC.tDead, pic = mine && RC.pic ? RC.pic : null;
    const picH = pic || mine && RC.picPend ? `<figure class="rcPic"><img class="rcPicImg" data-g="${RC.gen}"${pic ? ` src="${esc(pic)}"` : ""} alt="" width="${RC.picW}" height="${RC.picH}"><figcaption class="small">쓰러진 순간</figcaption></figure>` : "";
    const kill = picH || top || K ? `<div class="rcKill${picH ? "" : " noPic"}">${picH}<div class="rcK">${top}${K ? card(K, esc) : ""}</div></div>` : "";
    const sum = `<p class="rcSum">` + [ `받은 피해 모두 ${s.dAll != null ? s.dAll : "-"}`, `맞은 횟수 ${s.n}번`, `머리(헤드샷) ${s.head || 0}번`, s.armor ? `방어구가 막은 피해 ${s.armor}` : "" ].filter(Boolean).map((t, i) => `<span${i === 0 ? ` class="bad"` : i === 3 ? ` class="good"` : ""}>${t}</span>`).join(" · ") + `</p>`;
    const tot = s.tot.map(([n, v]) => `<span>${esc(n)}</span> ${v}`).join(" · ");
    const rows = s.last.slice().reverse().map(h => `<tr${h.dead ? ` class="rcDead"` : ""}><td>${agoT(h.ago)}</td><td${whoEn(h)}>${esc(who(h))}</td><td>${esc(wpn(h))}</td><td>${ammoH(h, esc, 1)}</td><td class="rcW">${whereH(h, 1)}</td><td>${h.d0}</td><td><b class="bad">${h.d}</b></td><td>${h.ab ? h.ab : "-"}</td><td class="rcW">${injH(h, esc)}</td><td>${esc(far(h))}</td></tr>`).join("");
    const cut = s.n > s.last.length ? ` <span class="small">(오래된 ${s.n - s.last.length}번은 표에서 빠졌습니다)</span>` : "";
    const table = rows ? `<h4 class="rcH">이 판에서 받은 피해 전부${cut}</h4><div class="rcScroll"><table class="rcT"><tr><th>언제</th><th>누구</th><th>무엇으로</th><th data-en="Ammo">탄</th><th>맞은 곳</th><th data-en="Dmg">피해</th><th>받은 피해</th><th>방어구</th><th data-en="Wounds">부상</th><th data-en="Range">거리</th></tr>${rows}</table></div>` : "";
    return `<div class="recap"><h3>의식을 잃은 까닭</h3>${kill}${sum}<p class="small rcBy">누구에게 얼마나: ${tot || "-"}</p>${table}</div>`;
  };
})(window.SX);
