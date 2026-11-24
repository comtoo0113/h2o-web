"use strict";

(function(SX) {
  const A = SX.actors, I = SX.items;
  const C = SX.coop = {
    ws: null,
    id: null,
    room: null,
    host: null,
    peers: new Map,
    state: "off",
    msg: "",
    raid: null,
    ghosts: new Map,
    applying: false,
    q: null,
    spec: null,
    job: null
  };
  const ST_HZ = 12, ES_HZ = 10, ES_FULL = 1;
  const r2 = v => Math.round(v * 100) / 100;
  const Rd = () => SX.raid;
  C.on = () => C.state === "in";
  C.isHost = () => C.on() && C.id === C.host;
  C.nameOf = id => id === C.id ? SX.net && SX.net.name && SX.net.name() || "나" : (C.peers.get(id) || {}).name || "#" + id;
  const dirty = () => {
    if (SX.ui) {
      SX.ui.coopDirty && SX.ui.coopDirty();
      SX.ui.hudDirty && SX.ui.hudDirty();
    }
  };
  const wsUrl = () => "";
  const wsSend = o => {
    const ws = C.ws;
    if (ws && ws.readyState === 1) ws.send(JSON.stringify(o));
  };
  function msend(d, to) {
    wsSend(to != null ? {
      t: "mrelay",
      to,
      d
    } : {
      t: "mrelay",
      d
    });
  }
  let afterWelcome = null;
  C.connect = function(code, then, raidOk) {
    if (SX.TRIAL) {
      C.msg = "체험판에서는 같이 하기를 쓸 수 없습니다";
      dirty();
      return;
    }
    if (!SX.net || SX.net.badOrigin()) {
      C.msg = "게임을 서버 주소로 열어야 같이 할 수 있습니다";
      dirty();
      return;
    }
    if (!SX.net.on()) {
      C.msg = "로그인부터 — 같이 하기는 계정이 있어야 합니다";
      dirty();
      return;
    }
    if (SX.game.inRaid() && !raidOk) {
      C.msg = "판 안에서는 파티를 못 바꿉니다";
      dirty();
      return;
    }
    C.leave(true, true);
    afterWelcome = then || null;
    code = String(code || "").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4);
    C.state = "connecting";
    C.msg = code ? code + " 방에 들어가는 중…" : "방 만드는 중…";
    dirty();
    let ws;
    try {
      ws = new WebSocket(wsUrl());
    } catch (e) {
      C.state = "off";
      C.msg = "연결을 못 열었습니다";
      dirty();
      return;
    }
    C.ws = ws;
    ws.onopen = () => ws.send(JSON.stringify({
      t: "join",
      token: SX.net.token,
      room: code,
      game: "dot"
    }));
    ws.onmessage = ev => {
      if (C.ws !== ws) return;
      let m;
      try {
        m = JSON.parse(ev.data);
      } catch (e) {
        return;
      }
      onMsg(m);
    };
    ws.onclose = () => {
      if (C.ws !== ws) return;
      const was = C.state, why = C.msg, inRaid = !!C.raid;
      reset(true);
      C.msg = was === "in" ? "연결이 끊겼습니다" : why && !/중…$/.test(why) ? why : "서버에 못 닿았습니다";
      if (was === "in") SX.log("🌐 서버와 연결이 끊겼습니다" + (inRaid ? " — 판은 혼자 이어 갑니다" : ""), "bad");
      const f = afterWelcome;
      afterWelcome = null;
      if (f && f.fallback) f.fallback();
      dirty();
    };
    ws.onerror = () => {};
  };
  C.leave = function(quiet, keepRaid) {
    const ws = C.ws;
    if (C.raid && !keepRaid) C.leaveRaid();
    reset(keepRaid);
    if (ws) {
      try {
        ws.close();
      } catch (e) {}
    }
    if (!quiet) {
      try {
        localStorage.removeItem(LAST);
      } catch (e) {}
      C.msg = "파티에서 나왔습니다";
      SX.log("🌐 파티에서 나왔습니다");
      dirty();
    }
  };
  function reset(keepRaid) {
    C.ws = null;
    C.state = "off";
    C.id = null;
    C.room = null;
    C.host = null;
    C.peers.clear();
    C.q = null;
    if (!keepRaid) {
      C.raid = null;
      C.ghosts.clear();
    } else if (C.raid) {
      C.raid.offline = true;
      C.ghosts.clear();
    }
  }
  setInterval(() => wsSend({
    t: "ping",
    at: Date.now()
  }), 2e4);
  const LAST = "sxd_coop";
  C.lastRoom = () => {
    try {
      const l = JSON.parse(localStorage.getItem(LAST) || "null");
      return l && l.room && Date.now() - (l.at || 0) < 2 * 36e5 ? l.room : null;
    } catch (e) {
      return null;
    }
  };
  C.rejoin = function(then) {
    if (C.state !== "off" || !SX.net || !SX.net.on()) return false;
    const room = C.lastRoom();
    if (!room) return false;
    C.connect(room, then);
    return true;
  };
  const myLook = () => SX.free && SX.free.lookNow && SX.free.lookNow() || SX.game && SX.game.save && SX.game.save.look || null;
  const myTitle = () => SX.feats && SX.game && SX.game.save && SX.feats.title(SX.game.save) || "";
  const myNg = () => (SX.game && SX.game.save && SX.game.save.ng) | 0;
  function specOf(look) {
    if (!look) return null;
    if (look.custom) {
      const cu = SX.art.decodeCustom(look.custom);
      if (cu) return {
        key: "plc" + SX.hash(look.custom),
        kind: "player",
        custom: cu,
        keepArms: !!look.keepArms
      };
    }
    return Object.assign({
      key: "pl" + SX.hash(JSON.stringify(look)),
      kind: "player"
    }, look);
  }
  function onMsg(m) {
    if (m.t === "relay" && m.d && m.d.k === "obOut") {
      if (C.isHost()) SX.log("🌐 🎓 " + C.nameOf(m.from) + " 은(는) 아직 튜토리얼 · 연습장을 안 해서 이번엔 빠집니다", "warn");
      return;
    }
    if (m.t === "relay" && m.d && m.d.k === "bandOut") {
      if (C.isHost()) SX.log("🌐 🩹 " + C.nameOf(m.from) + " 은(는) 첫 출격인데 붕대가 없어 아직 대기열에 안 붙었습니다", "warn");
      return;
    }
    if (m.t === "relay" && m.d && m.d.k === "kitOut") {
      if (C.isHost()) SX.log("🌐 " + C.nameOf(m.from) + " 은(는) 출격 전 확인 창에서 [돌아가기]를 눌러 이번엔 빠집니다", "warn");
      return;
    }
    switch (m.t) {
     case "welcome":
      {
        C.state = "in";
        C.id = m.id;
        C.room = m.room;
        C.host = m.host;
        C.peers.clear();
        for (const p of m.peers || []) if (!p.srv) C.peers.set(p.id, {
          id: p.id,
          name: p.name
        });
        C.msg = "";
        try {
          localStorage.setItem(LAST, JSON.stringify({
            room: m.room,
            at: Date.now()
          }));
        } catch (e) {}
        const f = afterWelcome;
        afterWelcome = null;
        if (!f || !f.quiet) SX.log("🌐 " + m.room + " 파티 — " + (C.isHost() ? "파티를 만들었습니다(파티장)" : "들어왔습니다"), "good");
        if (f && f.fn) f.fn();
        dirty();
        return;
      }

     case "join":
      if (m.srv) return;
      C.peers.set(m.id, {
        id: m.id,
        name: m.name
      });
      SX.log("🌐 " + m.name + " 이(가) 파티에 들어왔습니다", "good");
      dirty();
      return;

     case "leave":
      {
        const p = C.peers.get(m.id);
        C.peers.delete(m.id);
        if (m.hostLeft && m.newHost != null) {
          C.host = m.newHost;
          if (C.isHost()) SX.log("🌐 파티장이 나가서 이제 내가 파티장입니다", "good");
        }
        if (p) SX.log("🌐 " + p.name + " 이(가) 파티를 나갔습니다");
        dirty();
        return;
      }

     case "error":
      C.msg = String(m.msg || "안 됐습니다");
      SX.log("🌐 " + C.msg, "bad");
      if (C.state !== "in") {
        const ws = C.ws, why = C.msg, f = afterWelcome;
        afterWelcome = null;
        reset(true);
        C.msg = why;
        if (ws) try {
          ws.close();
        } catch (e) {}
        if (/없는 방/.test(why)) try {
          localStorage.removeItem(LAST);
        } catch (e) {}
        if (f && f.fallback) f.fallback();
      } else if (C.q && C.q.host && /출격|방/.test(C.msg)) C.q = null;
      dirty();
      return;

     case "queued":
      onQueued(m);
      return;

     case "qstat":
      C.q = Object.assign(C.q || {}, m, {
        on: true
      });
      dirty();
      return;

     case "qnowno":
      SX.log("🌐 " + (m.msg || "지금은 바로 출격이 막혀 있습니다"), "warn");
      if (C.q) {
        C.q.nowOk = false;
        C.q.online = m.online;
        C.q.nowMax = m.nowMax;
      }
      SX.audio && SX.audio.play("denied");
      dirty();
      return;

     case "unqueued":
      if (C.q) SX.log("🌐 매칭 대기를 멈췄습니다" + (m.why ? " — " + m.why : ""));
      C.q = null;
      dirty();
      return;

     case "match":
      onMatch(m);
      return;

     case "mrejoin":
      if (!m.ok) onRejoinFailed();
      return;

     case "mrelay":
      onData(m.from, m.d || {});
      return;

     case "relay":
      if (m.d && m.d.k === "freeOut" && C.isHost()) SX.log("🌐 🎒 " + C.nameOf(m.from) + " 은(는) 마지막 희망 판 쉬는 시간이 남아 이번엔 빠집니다", "warn");
      if (m.d && m.d.k === "chat") {
        const p = C.peers.get(m.from);
        if (p) chatIn(p.name, m.d);
      }
      return;

     case "visited":
      if (SX.visit) SX.visit.visited(m);
      return;

     case "mgone":
      peerGone(m.gid, m.drop);
      return;

     case "mback":
      {
        const R = C.raid;
        if (R) {
          R.members.add(m.gid);
          SX.log("🌐 " + (R.names.get(m.gid) || "누가") + " 이(가) 판에 돌아왔습니다");
        }
        dirty();
        return;
      }
    }
  }
  C.canQueue = () => !!(SX.net && SX.net.on() && !SX.net.badOrigin());
  C.freeT = null;
  C.queue = function(b, tod, opt) {
    const s = SX.game.save, fr = opt && opt.free || null;
    const go = () => {
      if (!C.isHost()) {
        C.msg = "출격은 파티장이 누릅니다";
        SX.log("🌐 출격은 파티장이 누릅니다 — 혼자 가려면 파티를 나가시면 됩니다", "warn");
        dirty();
        return;
      }
      C.freeT = fr;
      const solo = !!(SX.soloMap && SX.soloMap(b));
      const mode = SX.prog && SX.prog.raidMode ? SX.prog.raidMode(b.id, SX.net.now()) : "normal";
      C.q = {
        b: b.id,
        tod,
        mode,
        teams: 1,
        players: 1 + C.peers.size,
        waited: 0,
        max: solo ? 5 : 45,
        startIn: null,
        host: true,
        on: true,
        free: !!fr,
        solo
      };
      wsSend({
        t: "queue",
        b: b.id,
        tod,
        mode,
        intel: fr ? null : s.intel || null,
        god: !!SX.game.god,
        free: fr ? 1 : 0
      });
      SX.log("🌐 " + (fr ? "🎒 마지막 희망 판 · " : "") + b.name + " · " + (tod === "night" ? "밤" : "낮") + (solo ? " — 단층 지도라 다른 생존자는 들어오지 않습니다(파티원이 붙으면 바로 출발)" : " — 같은 곳을 누른 사람을 기다리고 있습니다(없으면 45초 뒤 출발)"), "good");
      SX.ui.openQueue && SX.ui.openQueue();
      dirty();
    };
    if (C.on()) go(); else {
      C.msg = "서버에 붙는 중…";
      dirty();
      C.connect("", {
        fn: go,
        quiet: true,
        fallback: () => {
          SX.log("🌐 서버에 못 닿았습니다 — 혼자 출격합니다", "warn");
          SX.game.startRaid(b, tod, fr ? {
            free: fr
          } : undefined);
        }
      });
    }
  };
  C.unqueue = () => {
    wsSend({
      t: "unqueue"
    });
  };
  C.qnow = () => {
    wsSend({
      t: "qnow"
    });
  };
  function onQueued(m) {
    const G = SX.game;
    if (G.state !== "hub") {
      SX.log("🌐 파티장이 출격 대기를 걸었습니다 — 거점에 있을 때만 같이 갑니다");
      return;
    }
    {
      const w = SX.onboard && SX.onboard.coopWhy(m.b);
      if (w) {
        SX.log("🌐 🎓 파티장이 출격 대기를 걸었지만 이번엔 빠집니다 — " + w, "warn");
        if (SX.ui.bigNote) SX.ui.bigNote("파티 출격에 같이 못 갑니다", w, SX.ui.NOTE_MS);
        if (C.host != null) wsSend({
          t: "relay",
          to: C.host,
          d: {
            k: "obOut"
          }
        });
        dirty();
        return;
      }
    }
    const join = fr => {
      wsSend({
        t: "qjoin"
      });
      C.freeT = fr || null;
      C.q = {
        b: m.b,
        tod: m.tod,
        mode: m.mode || "normal",
        teams: 1,
        players: 1,
        waited: 0,
        max: m.solo ? 5 : 45,
        startIn: null,
        host: false,
        on: true,
        free: !!fr,
        solo: !!m.solo
      };
      SX.log(fr ? "🌐 🎒 파티장이 마지막 희망 판으로 출격 대기를 걸었습니다 — 받은 장비로 같이 갑니다" : "🌐 파티장이 출격 대기를 걸었습니다 — 같이 갑니다", "good");
      SX.ui.openQueue && SX.ui.openQueue();
      dirty();
    };
    const joinK = fr => {
      join(fr);
      if (SX.kitck && SX.kitck.member) SX.kitck.member(m, fr, () => {
        C.unqueue();
        if (C.host != null) wsSend({
          t: "relay",
          to: C.host,
          d: {
            k: "kitOut"
          }
        });
        dirty();
      });
    };
    C.qm = m;
    if (!m.free && SX.onboard && SX.onboard.bandOut && SX.onboard.bandOut(m, joinK, () => {
      if (C.host != null) wsSend({
        t: "relay",
        to: C.host,
        d: {
          k: "bandOut"
        }
      });
      dirty();
    })) return;
    if (!m.free) {
      joinK(null);
      return;
    }
    if (!SX.free) {
      SX.log("🌐 파티장이 마지막 희망 판으로 출격 대기를 걸었지만 이 창은 마지막 희망 판을 모릅니다 — 새로고침해 주십시오", "warn");
      return;
    }
    SX.free.ticket().then(r => {
      if (!r.ok) {
        SX.log("🌐 🎒 파티장이 마지막 희망 판으로 출격 대기를 걸었습니다 — " + r.msg + " · 이번엔 빠집니다", "warn");
        if (C.host != null) wsSend({
          t: "relay",
          to: C.host,
          d: {
            k: "freeOut"
          }
        });
        dirty();
        return;
      }
      if (SX.game.state === "hub") joinK(r.t);
    });
  }
  function onMatch(m) {
    const G = SX.game;
    C.q = null;
    const b = SX.data.buildings.find(x => x.id === m.b);
    if (!b) return;
    const info = {
      mid: m.mid,
      at: typeof m.at === "number" && isFinite(m.at) ? m.at : null,
      me: m.you,
      team: m.team,
      auth: m.auth,
      list: m.list,
      intel: m.intel,
      lead: !!m.lead,
      mode: m.mode || "normal",
      wk: m.wk,
      t0: typeof m.el === "number" && isFinite(m.el) ? performance.now() - Math.max(0, Math.min(36e5, m.el)) : null
    };
    if (m.rejoin) {
      onRejoinMatch(info);
      return;
    }
    if (G.state !== "hub") {
      wsSend({
        t: "mleave"
      });
      return;
    }
    const fr = m.free ? C.freeT : null;
    C.freeT = null;
    if (m.free && !fr) {
      wsSend({
        t: "mleave"
      });
      SX.log("🌐 🎒 마지막 희망 판 장비를 못 받아 이번 판은 빠집니다", "warn");
      return;
    }
    if (SX.home && SX.home.deco) SX.home.stopDeco(true);
    const teams = new Set(m.list.map(x => x[2])).size;
    SX.log("🌐 " + b.name + " 출격 — " + m.list.length + "명 · " + teams + "팀" + (teams > 1 ? "(다른 팀은 적입니다)" : m.solo ? "(다른 생존자는 들어오지 않습니다)" : ""), "good");
    G.startRaid(b, m.tod, {
      seed: m.seed,
      match: info,
      free: fr
    });
  }
  C.matchInfo = () => {
    const R = C.raid;
    return R ? {
      mid: R.mid,
      me: R.me,
      team: R.team,
      room: C.room || C.lastRoom()
    } : null;
  };
  const raidMates = () => {
    const R = R_(), out = [];
    if (R) for (const [gid, tm] of R.teams) if (gid !== R.me && tm === R.team && R.members.has(gid)) out.push(R.names.get(gid) || "#" + gid);
    return out;
  };
  C.chatMates = function() {
    const s = new Set(raidMates());
    if (C.on()) for (const p of C.peers.values()) s.add(p.name);
    return s.size;
  };
  C.chatName = () => {
    const R = R_();
    return SX.net && SX.net.name && SX.net.name() || R && R.names.get(R.me) || C.nameOf(C.id);
  };
  C.chatSend = function(x, i) {
    let n = 0;
    if (C.on() && C.peers.size) {
      wsSend({
        t: "relay",
        d: {
          k: "chat",
          x,
          i
        }
      });
      n++;
    }
    const R = R_();
    if (R && raidMates().length) {
      msend({
        k: "chat",
        s: R.seed,
        x,
        i
      });
      n++;
    }
    return n;
  };
  function chatIn(name, d) {
    if (SX.chat && name && d) SX.chat.got(String(name), d.x, d.i);
  }
  const R_ = () => C.raid && !C.raid.offline ? C.raid : null;
  C.inCoop = () => !!R_();
  C.runEnemies = () => !R_() || C.raid.auth === C.raid.me;
  C.isAuth = C.runEnemies;
  const floorOf = f => Rd().level ? Rd().level.floors[f] : null;
  function newRaid(mi, offline) {
    const R = {
      mid: mi.mid,
      seed: Rd().seed,
      me: mi.me,
      team: mi.team,
      auth: mi.auth != null ? mi.auth : mi.me,
      members: new Set,
      names: new Map,
      teams: new Map,
      specs: new Map,
      titles: new Map,
      ngs: new Map,
      stT: 0,
      esT: 0,
      esFullT: 0,
      last: new Map,
      denied: new Set,
      cgQ: new Map,
      offline: !!offline,
      t0: mi.t0 != null ? mi.t0 : null
    };
    for (const [gid, name, team] of mi.list || []) {
      R.members.add(gid);
      R.names.set(gid, name);
      R.teams.set(gid, team);
    }
    return R;
  }
  C.beginRaid = function(opt) {
    C.ghosts.clear();
    pend.clear();
    C.spec = null;
    C.job = null;
    if (!opt || !opt.match) {
      C.raid = null;
      return;
    }
    const mi = opt.match;
    const R = C.raid = newRaid(mi);
    msend({
      k: "hi",
      s: R.seed,
      look: myLook(),
      title: myTitle(),
      ng: myNg()
    });
    sendGeo();
    const sp = Rd().spawnFor(mi.team), p = A.player, F = Rd().floor();
    const mates = mi.list.filter(x => x[2] === mi.team).map(x => x[0]).sort((a, b) => a - b);
    const k = Math.max(0, mates.indexOf(mi.me)), off = (k - (mates.length - 1) / 2) * .8;
    if (sp && p && F) {
      const nx = sp.x + (sp.side === "s" || sp.side === "n" ? off : 0), ny = sp.y + (sp.side === "w" || sp.side === "e" ? off : 0);
      const ok = A.free(F, nx, ny);
      p.x = ok ? nx : sp.x;
      p.y = ok ? ny : sp.y;
      for (const al of A.allies) {
        al.x = p.x + .8;
        al.y = p.y + .6;
      }
      SX.view && SX.view.snap && SX.view.snap();
    }
    const foes = mi.list.filter(x => x[2] !== mi.team).length;
    SX.log("🌐 " + (foes ? "적 팀 " + foes + "명이 같은 건물에 있습니다 — 사람 조심하십시오" : "우리 파티만 들어왔습니다") + " · " + (R.auth === R.me ? "적은 이 창이 돌립니다" : "적은 " + R.names.get(R.auth) + " 창이 돌립니다"), foes ? "warn" : "good");
    dirty();
  };
  function sendGeo() {
    const R = C.raid, lv = Rd().level, T = SX.map && SX.map.T;
    if (!R || R.offline || !lv || !T) return;
    const b64 = u8 => {
      let s = "";
      for (let i = 0; i < u8.length; i += 8192) s += String.fromCharCode.apply(null, u8.subarray(i, i + 8192));
      return btoa(s);
    };
    const fl = lv.floors.map((F, f) => {
      const n = F.W * F.H, u8 = new Uint8Array(Math.ceil(n / 4));
      for (let i = 0; i < n; i++) {
        const c = F.t[i] === T.DOOR ? 2 : F.opaque(i % F.W, i / F.W | 0) ? 1 : 0;
        if (c) u8[i >> 2] |= c << (i & 3) * 2;
      }
      return {
        f,
        W: F.W,
        H: F.H,
        c: b64(u8),
        d: F.doors.map(d => [ d.open ? 1 : 0 ].concat(d.tiles.slice(0, 8)))
      };
    });
    wsSend({
      t: "mgeo",
      s: R.seed,
      fl
    });
  }
  C._sendGeo = sendGeo;
  const STALE_MS = 600;
  C.stale = g => !!(g && !g.mate && g.stAt && performance.now() - g.stAt > STALE_MS);
  C.leaveRaid = function() {
    const R = C.raid;
    if (!R) return;
    if (!R.offline) {
      const others = [ ...R.members ].filter(id => id !== R.me);
      if (R.auth === R.me && others.length) msend({
        k: "auth",
        s: R.seed,
        to: Math.min(...others),
        en: A.enemies.map(dynOf)
      });
    }
    wsSend({
      t: "mleave"
    });
    C.raid = null;
    C.ghosts.clear();
    pend.clear();
    pendT.clear();
    C.spec = null;
    C.job = null;
    dirty();
  };
  function peerGone(gid, drop) {
    const R = C.raid;
    if (!R) return;
    R.members.delete(gid);
    C.ghosts.delete(gid);
    if (R.auth === gid) promote();
    if (drop) SX.log("🌐 " + (R.names.get(gid) || "누가") + " 의 연결이 끊겼습니다");
    dirty();
  }
  function promote() {
    const R = C.raid;
    if (!R) return;
    R.auth = Math.min(...[ ...R.members, R.me ]);
    if (R.auth === R.me) {
      for (const e of A.enemies) if (e.alive && e.tx != null) {
        e.x = e.tx;
        e.y = e.ty;
        e.tx = null;
      }
      SX.log("🌐 판 주인이 나갔습니다 — 이제 이 창이 적을 돌립니다", "warn");
    }
  }
  function dynOf(e) {
    return [ e.nid, r2(e.x), r2(e.y), r2(e.face || 0), Math.round(e.hp * 10) / 10, e.alive ? 1 : 0, e.ai, e.lureX, e.lureY, r2(e.lureT || 0), e.seenX, e.seenY, r2(e.susT || 0) ];
  }
  function onAuth(d) {
    const R = C.raid;
    R.auth = d.to;
    if (d.to !== R.me) {
      dirty();
      return;
    }
    for (const a of d.en || []) {
      const e = A.enemies[a[0]];
      if (!e || !a[5] || !e.alive) continue;
      e.x = a[1];
      e.y = a[2];
      e.face = a[3];
      e.hp = a[4];
      e.ai = a[6];
      e.lureX = a[7];
      e.lureY = a[8];
      e.lureT = a[9];
      e.seenX = a[10];
      e.seenY = a[11];
      e.susT = Math.min(40, Math.max(0, +a[12] || 0));
      e.susP = null;
      e.tx = null;
      e.calmT = 0;
      e.fsT = Math.random() * .3;
    }
    SX.log("🌐 판 주인이 판을 떠났습니다 — 이제 이 창이 적을 돌립니다", "warn");
    dirty();
  }
  C.resumeMatch = function(info) {
    C.raid = newRaid({
      mid: info.mid,
      me: info.me,
      team: info.team,
      auth: info.me,
      list: []
    }, true);
    C.raid.pendingRejoin = true;
    const go = () => wsSend({
      t: "mrejoin",
      mid: info.mid
    });
    const giveUp = () => {
      if (C.raid && C.raid.pendingRejoin) {
        C.raid = null;
        SX.log("🌐 서버에 못 붙었습니다 — 혼자 이어 갑니다", "warn");
        dirty();
      }
    };
    const fresh = () => C.connect("", {
      fn: go,
      quiet: true,
      fallback: giveUp
    }, true);
    if (C.on()) go(); else if (info.room) C.connect(info.room, {
      fn: go,
      quiet: true,
      fallback: fresh
    }, true); else fresh();
  };
  function onRejoinMatch(info) {
    const R = C.raid;
    if (!R || R.mid !== info.mid || !SX.game.inRaid()) {
      wsSend({
        t: "mleave"
      });
      return;
    }
    const fresh = newRaid(info);
    fresh.denied = R.denied;
    C.raid = fresh;
    msend({
      k: "hi",
      s: fresh.seed,
      look: myLook(),
      title: myTitle(),
      ng: myNg()
    });
    if (fresh.auth !== fresh.me) msend({
      k: "sync",
      s: fresh.seed
    }, fresh.auth);
    SX.log("🌐 판에 다시 붙었습니다" + (fresh.auth !== fresh.me ? " — 지금 모습을 받는 중" : " — 이 창이 적을 돌립니다"), "good");
    dirty();
  }
  function onRejoinFailed() {
    const R = C.raid;
    if (R && R.pendingRejoin) {
      C.raid = null;
      SX.log("🌐 그 판은 이미 끝났습니다 — 혼자 이어 갑니다", "warn");
    }
    dirty();
  }
  C.update = function(dt) {
    const R = R_();
    if (!R) return;
    const p = A.player;
    R.stT -= dt;
    if (R.stT <= 0 && p) {
      R.stT = 1 / ST_HZ;
      msend(stOf(p));
    }
    if (R.auth === R.me) {
      R.esT -= dt;
      R.esFullT -= dt;
      if (R.esT <= 0) {
        R.esT = 1 / ES_HZ;
        sendEnemies(R.esFullT <= 0);
        if (R.esFullT <= 0) R.esFullT = ES_FULL;
      }
      R.hfxT = (R.hfxT || 0) - dt;
      if (R.hfxT <= 0 && R.hfxQ && R.hfxQ.length) {
        R.hfxT = .05;
        hfxFlush(R);
      }
      histRec();
      R.pgT = (R.pgT || 0) - dt;
      if (R.pgT <= 0) {
        R.pgT = 2;
        msend({
          k: "pg",
          s: R.seed,
          at: Math.round(performance.now())
        });
      }
    } else {
      A.clock += dt;
      lerpEnemies(dt);
    }
    if (R.t0 != null && Rd().catchUp) {
      const lag = (performance.now() - R.t0) / 1e3 * (SX.PACE || 1) - Rd().t;
      if (lag > .25) Rd().catchUp(lag);
    }
    for (const g of C.ghosts.values()) lerpGhost(g, dt);
    if (R.cgQ.size && !(SX.ui.isDragging && SX.ui.isDragging())) {
      for (const [k, d] of R.cgQ) {
        const c = Rd().conts.get(k);
        if (c) applyGrid(c, d.g, k);
      }
      R.cgQ.clear();
    }
    reviveTick(dt);
    specTick();
  };
  function stOf(p) {
    const w = A.weaponOf(p), al = A.allies.find(a => a.alive);
    const d = {
      k: "st",
      s: C.raid.seed,
      x: r2(p.x),
      y: r2(p.y),
      f: p.floor,
      a: r2(p.aim),
      m: p.moving ? 1 : 0,
      sp: p.sprinting ? 1 : 0,
      c: p.crouch ? 1 : 0,
      bx: p.boxOn ? 1 : 0,
      w: w ? w.name : "",
      hp: Math.round(p.hp),
      al: p.alive ? 1 : 0,
      t: p.torch ? 1 : 0,
      sw: p.swing > 0 ? 1 : 0,
      q: SX.input.held("quiet") ? 1 : 0
    };
    if (p.keyT > 0) d.ky = 1;
    if (p.stairFx && SX.pose && SX.pose.stairPack) {
      const sf = SX.pose.stairPack(p);
      if (sf) d.sf = sf;
    }
    if (p.typeT > 0) d.ty = 1;
    if (SX.melee && SX.melee.active(p)) {
      d.sn = p.punchN | 0;
      if (!w || w.name !== p.swingW.name) d.sm = p.swingW.name;
    }
    if (p.takeT > 0) d.tk = 1;
    if (SX.mis && SX.mis.myPose) {
      const mp = SX.mis.myPose();
      if (mp) d.mp = mp;
    }
    if (p.use && p.use.trap) d.pl = 1;
    if (SX.nvg) {
      const nv = SX.nvg.state(p);
      if (nv) d.nv = nv;
    }
    if (p.down) d.dn = [ Math.round(p.down.t), Math.round(p.down.hp) ];
    if (C.job) d.rv = C.job.gid; else if (SX.ev && SX.ev.jobOn && SX.ev.jobOn() || SX.week && SX.week.jobOn && SX.week.jobOn() || SX.mis && SX.mis.jobOn && SX.mis.jobOn()) d.rv = -2; else if (SX.bdev && SX.bdev.kneel && SX.bdev.kneel()) d.rv = -2;
    if (SX.bdev && SX.bdev.pose) {
      const bp = SX.bdev.pose();
      if (bp) d.bp = bp;
    }
    const sk = SX.skills ? SX.skills.mul("stealth") : 1;
    if (sk !== 1) d.sk = r2(sk);
    const tc = SX.tac && SX.tac.netState ? SX.tac.netState() : null;
    if (tc) d.tc = tc;
    {
      const kt = p.kit || {}, ac = A.armorClsOf ? A.armorClsOf(kt.armor) : 0, hc = A.armorClsOf ? A.armorClsOf(kt.helmet) : 0;
      if (ac) d.ac = ac;
      if (hc) d.hc = hc;
    }
    const vh = A.viewHalf();
    d.v = [ Math.round(vh.hx * 10) / 10, Math.round(vh.hy * 10) / 10 ];
    if (al) {
      d.ally = {
        x: r2(al.x),
        y: r2(al.y),
        f: al.floor,
        a: r2(al.face || 0),
        id: al.merc.id,
        m: al.moving ? 1 : 0
      };
      if (SX.melee && SX.melee.active(al)) d.ally.sn = al.punchN | 0;
    }
    return d;
  }
  function mkGhost(gid) {
    const R = C.raid;
    return {
      kind: "peer",
      pid: gid,
      name: R.names.get(gid) || "#" + gid,
      team: R.teams.get(gid),
      mate: R.teams.get(gid) === R.team,
      x: 0,
      y: 0,
      floor: 0,
      tx: 0,
      ty: 0,
      aim: 0,
      dir: 0,
      frame: 0,
      walkT: 0,
      spec: R.specs.get(gid) || SX.art.charSpec("scav", new SX.Rng(gid * 7 + 1)),
      alive: true,
      hp: 100,
      r: .24,
      swing: 0,
      kick: 0,
      muzzleT: 0,
      hurtT: 0,
      flinch: 0,
      weaponDef: null,
      wName: "",
      title: R.titles.get(gid) || "",
      ng: (R.ngs && R.ngs.get(gid)) | 0,
      down: null,
      reviving: null,
      takeT: 0,
      tkOn: false,
      placing: false
    };
  }
  function onHi(from, d) {
    const R = C.raid;
    if (R.auth === R.me && from !== R.me) R.esFullT = 0;
    teamHi(from);
    const tt = typeof d.title === "string" ? d.title.slice(0, 16) : "";
    R.titles.set(from, tt);
    const g0 = C.ghosts.get(from);
    if (g0) g0.title = tt;
    {
      const n = Math.max(0, Math.min(99, d.ng | 0));
      if (R.ngs) R.ngs.set(from, n);
      if (g0) g0.ng = n;
    }
    const sp = specOf(d.look);
    if (!sp) return;
    R.specs.set(from, sp);
    const g = C.ghosts.get(from);
    if (g) g.spec = sp;
  }
  function onSt(from, d) {
    const R = C.raid;
    R.members.add(from);
    let g = C.ghosts.get(from);
    if (!g) {
      g = mkGhost(from);
      g.x = g.tx = d.x;
      g.y = g.ty = d.y;
      g.floor = d.f;
      C.ghosts.set(from, g);
      dirty();
    }
    if (g.floor !== d.f || C.stale(g)) {
      g.x = d.x;
      g.y = d.y;
    }
    g.stAt = performance.now();
    g.floor = d.f;
    g.tx = d.x;
    g.ty = d.y;
    g.aim = d.a;
    g.dir = A.dirOf(d.a);
    g.ac = d.ac | 0;
    g.hc = d.hc | 0;
    g.moving = !!d.m;
    g.sprinting = !!d.sp;
    g.crouch = !!d.c;
    g.boxOn = !!d.bx;
    g.hp = d.hp;
    g.torch = !!d.t;
    g.quiet = !!d.q;
    if (d.sn != null && SX.melee) {
      if ((d.sn | 0) !== g.sn) {
        g.sn = d.sn | 0;
        const md = I.def(typeof d.sm === "string" ? d.sm : d.w);
        if (md && md.kind === "melee") {
          const k = SX.melee.start(g, md, num(d.a, 0), "peer", g.sn);
          if (k && A.player && A.player.floor === d.f) SX.audio.play(k.snd, {
            x: d.x,
            y: d.y,
            f: d.f,
            range: 12,
            vol: .55
          });
        }
      }
    } else if (d.sw) g.swing = Math.max(g.swing, .2);
    g.keyT = d.ky ? 1 : 0;
    if (SX.pose && SX.pose.stairUnpack) SX.pose.stairUnpack(g, d.sf);
    g.typeT = d.ty ? 1 : 0;
    if (d.tk && !g.tkOn) {
      g.takeT = A.TAKE_T || .55;
      if (A.player && A.player.floor === g.floor) SX.audio.play("takedown", {
        x: g.x,
        y: g.y,
        range: 10,
        vol: .7
      });
    }
    g.tkOn = !!d.tk;
    g.placing = !!d.pl;
    if (SX.nvg) SX.nvg.netApply(g, d.nv);
    {
      const was = !!g.down;
      g.down = Array.isArray(d.dn) ? {
        t: Math.max(0, num(d.dn[0], 0)),
        hp: Math.max(0, num(d.dn[1], 0))
      } : null;
      if (g.mate && g.alive && d.al) {
        if (g.down && !was) SX.log("🌐 " + g.name + " 이(가) 쓰러졌습니다 — 곁에서 [" + SX.label("interact") + "] 를 붙잡아 일으키십시오(" + Math.ceil(g.down.t) + "초 안에)", "bad"); else if (!g.down && was) SX.log("🌐 " + g.name + " 이(가) 일어났습니다", "good");
      }
      g.misP = typeof d.mp === "string" && d.mp.length < 8 ? d.mp : null;
      g.reviving = d.rv != null ? d.rv : null;
    }
    g.alive = !!d.al;
    if (SX.bdev && SX.bdev.peerPose) SX.bdev.peerPose(g, d.bp | 0);
    if (g.wName !== d.w) {
      g.wName = d.w;
      g.weaponDef = d.w ? I.def(d.w) : null;
    }
    g.sk = d.sk > 0 && d.sk <= 1 ? +d.sk : 1;
    if (Array.isArray(d.v) && d.v[0] > 3 && d.v[1] > 2) g.view = {
      hx: Math.min(60, +d.v[0]),
      hy: Math.min(40, +d.v[1])
    };
    if (SX.tac && SX.tac.netApply) SX.tac.netApply(g, d.tc);
    if (SX.sndPlace && g.moving && g.alive) SX.sndPlace.peerStep(g, 1 / ST_HZ, floorOf(g.floor));
    if (R.auth === R.me && g.moving && g.alive) {
      g.stepT = (g.stepT || 0) - 1 / ST_HZ;
      if (g.stepT <= 0) {
        g.stepT = g.quiet ? .6 : g.sprinting ? .225 : .36;
        const F = floorOf(g.floor);
        if (F) A.noise(F, g.x, g.y, (g.sprinting ? 12 : g.quiet ? 1.5 : 6) * g.sk * (SX.wx ? SX.wx.stepMul(F, g.x, g.y) : 1), true, 0, true);
      }
    }
    if (d.ally) {
      let m = g.ally;
      const def = SX.data.mercs.find(x => x.id === d.ally.id);
      const pax = !def && typeof d.ally.id === "string" && d.ally.id.indexOf("pax:") === 0 ? d.ally.id.slice(4) : null;
      if (m && m.allyId !== d.ally.id) {
        m = g.ally = null;
      }
      if (!m && pax) {
        const P0 = SX.prog, sp = SX.hub && SX.hub.civSpec ? SX.hub.civSpec(pax) : null;
        m = g.ally = {
          kind: "peer",
          isAlly: true,
          allyId: d.ally.id,
          pax,
          hideWeapon: true,
          pid: from,
          team: g.team,
          mate: g.mate,
          name: P0.ST_WHO && P0.ST_WHO[pax] || pax,
          x: d.ally.x,
          y: d.ally.y,
          tx: d.ally.x,
          ty: d.ally.y,
          floor: d.ally.f,
          spec: sp ? Object.assign({}, sp, {
            key: "pax" + pax
          }) : SX.art.charSpec("scav", new SX.Rng(7)),
          gunDef: null,
          meleeDef: null,
          aim: 0,
          face: 0,
          dir: 0,
          frame: 0,
          walkT: 0,
          alive: true,
          r: .24,
          swing: 0,
          kick: 0,
          muzzleT: 0,
          flinch: 0
        };
      }
      if (!m && def) {
        m = g.ally = {
          allyId: d.ally.id,
          kind: "peer",
          isAlly: true,
          pid: from,
          team: g.team,
          mate: g.mate,
          name: def.name,
          x: d.ally.x,
          y: d.ally.y,
          tx: d.ally.x,
          ty: d.ally.y,
          floor: d.ally.f,
          spec: A.mercSpec(def),
          gunDef: A.mercGun(def),
          meleeDef: A.mercMelee(def),
          aim: 0,
          face: 0,
          dir: 0,
          frame: 0,
          walkT: 0,
          alive: true,
          r: .24,
          swing: 0,
          kick: 0,
          muzzleT: 0,
          flinch: 0
        };
      }
      if (m) {
        if (m.floor !== d.ally.f) {
          m.x = d.ally.x;
          m.y = d.ally.y;
        }
        m.floor = d.ally.f;
        m.tx = d.ally.x;
        m.ty = d.ally.y;
        m.aim = m.face = d.ally.a;
        m.dir = A.dirOf(d.ally.a);
        m.moving = !!d.ally.m;
        m.alive = true;
        if (d.ally.sn != null && (d.ally.sn | 0) !== m.sn && SX.melee) {
          m.sn = d.ally.sn | 0;
          if (!m.gunDef && m.meleeDef) {
            const k = SX.melee.start(m, m.meleeDef, m.aim, "ally", m.sn);
            if (k && A.player && A.player.floor === m.floor) SX.audio.play(k.snd, {
              x: m.x,
              y: m.y,
              f: m.floor,
              range: 12,
              vol: .5
            });
          }
        }
      }
    } else if (g.ally) g.ally.alive = false;
  }
  function lerpOne(o, dt) {
    const dx = o.tx - o.x, dy = o.ty - o.y;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      o.x = o.tx;
      o.y = o.ty;
    } else {
      const k = Math.min(1, dt * 14);
      o.x += dx * k;
      o.y += dy * k;
    }
    if (o.moving) {
      o.walkT += dt * 9.4;
      o.frame = Math.floor(o.walkT) % 4;
    } else {
      o.frame = 0;
      o.walkT = 0;
    }
    o.swing = Math.max(0, o.swing - dt);
    o.kick = Math.max(0, o.kick - dt * 8);
    o.muzzleT -= dt;
    o.hurtT = Math.max(0, (o.hurtT || 0) - dt);
    o.flinch = Math.max(0, (o.flinch || 0) - dt);
    if (o.takeT > 0) o.takeT = Math.max(0, o.takeT - dt);
  }
  function lerpGhost(g, dt) {
    lerpOne(g, dt);
    if (g.ally && g.ally.alive) lerpOne(g.ally, dt);
  }
  C.floorsOn = function() {
    if (!R_() || !C.ghosts.size) return null;
    let s = null;
    for (const g of C.ghosts.values()) if (g.alive) (s = s || new Set).add(g.floor);
    return s;
  };
  C.ghostsOn = function(f) {
    const out = [];
    if (!R_()) return out;
    for (const g of C.ghosts.values()) {
      if (C.stale(g)) continue;
      if (g.alive && g.floor === f) out.push(g);
      if (g.ally && g.ally.alive && g.ally.floor === f) out.push(g.ally);
    }
    return out;
  };
  C.torches = function(f) {
    const out = [];
    if (!R_()) return out;
    for (const g of C.ghosts.values()) if (g.alive && g.torch && g.floor === f && !C.stale(g)) out.push({
      x: g.x,
      y: g.y - .4,
      a: g.aim
    });
    return out;
  };
  function tgtOf(g) {
    if (!g._t) g._t = {
      player: true,
      peer: g.pid,
      get x() {
        return g.x;
      },
      get y() {
        return g.y;
      },
      get floor() {
        return g.floor;
      },
      get alive() {
        return g.alive && C.raid != null && C.ghosts.get(g.pid) === g;
      },
      get view() {
        return g.view || null;
      },
      get cover() {
        return g.cover || null;
      },
      get low() {
        return !!(g.crouch || g.down);
      },
      get torch() {
        return !!g.torch;
      },
      get aim() {
        return g.aim || 0;
      },
      get shotAt() {
        return g.shotAt || 0;
      },
      get stealth() {
        let f = (g.sprinting ? 1.15 : g.quiet ? .55 : 1) * (g.torch && SX.game.env.night ? 1.25 : 1);
        if (g.crouch || g.down) f *= .55;
        if (g.boxOn) f *= g.moving ? .85 : .12;
        if (g.cover) f *= .7;
        return f;
      }
    };
    return g._t;
  }
  C.ghostTargets = function() {
    const out = [];
    if (!R_()) return out;
    for (const g of C.ghosts.values()) if (g.alive) out.push(tgtOf(g));
    return out;
  };
  C.ghostAt = function(f, x, y) {
    if (!R_()) return null;
    for (const g of C.ghosts.values()) {
      if (C.stale(g)) continue;
      if (g.alive && g.floor === f && Math.abs(g.x - x) < .35 && Math.abs(g.y - .5 - y) < .55) return g;
      const m = g.ally;
      if (m && m.alive && m.floor === f && Math.abs(m.x - x) < .35 && Math.abs(m.y - .5 - y) < .55) return m;
    }
    return null;
  };
  C.foesOn = function(f) {
    const out = [];
    if (!R_()) return out;
    for (const g of C.ghosts.values()) if (g.alive && !g.mate && g.floor === f) out.push(g);
    return out;
  };
  C.bodiesOn = function(f) {
    const out = [];
    if (!R_()) return out;
    for (const g of C.ghosts.values()) {
      if (C.stale(g)) continue;
      if (g.alive && g.floor === f) out.push(g);
      const m = g.ally;
      if (m && m.alive && m.floor === f) out.push(m);
    }
    return out;
  };
  C.pvpOn = function(f) {
    const R = R_();
    if (!R) return false;
    const p = A.player, ts = new Set;
    if (p && p.alive && p.floor === f) ts.add(R.team);
    for (const g of C.ghosts.values()) if (g.alive && !C.stale(g) && g.floor === f) ts.add(g.team);
    return ts.size > 1;
  };
  C.marks = function(f) {
    const out = [];
    if (!R_()) return out;
    for (const g of C.ghosts.values()) if (g.alive && g.mate && g.floor === f) out.push(g.down ? {
      f,
      x: g.x,
      y: g.y - .2,
      col: SX.cbc("bad", "rgb(255,120,110)", "rgb"),
      label: g.name + " 쓰러짐 " + Math.ceil(g.down.t),
      big: true
    } : {
      f,
      x: g.x,
      y: g.y - .2,
      col: SX.cbc("mate", "rgb(110,190,255)", "rgb"),
      label: g.name,
      edgeOnly: true
    });
    return out;
  };
  C.isMate = g => !!(g && g.mate);
  function sendEnemies(full) {
    const R = C.raid, occ = new Set;
    const p = A.player;
    if (p && p.alive) occ.add(p.floor);
    for (const g of C.ghosts.values()) if (g.alive) occ.add(g.floor);
    const out = [];
    for (const e of A.enemies) {
      if (!e.alive || !occ.has(e.floor) || e.nid == null) continue;
      const fl = (e.ai === "chase" ? 1 : 0) | (e.swing > 0 ? 2 : 0) | (e.muzzleT > 0 ? 4 : 0) | (e.flinch > 0 ? 8 : 0) | (e.sprinting ? 16 : 0) | (e.laser ? 32 : 0) | (e.stunT > 0 ? 64 : 0) | (e.gasT > 0 ? 128 : 0);
      const face = Math.round(((e.face || 0) % 6.2832 + 6.2832) % 6.2832 * 100);
      const row = [ e.nid, Math.round(e.x * 100), Math.round(e.y * 100), face, fl, Math.round((e.walkT || 0) * 10) % 400 ];
      row.push(Math.max(0, Math.round(e.hp)));
      row.push(awCode(e));
      const key = row[1] + "," + row[2] + "," + face + "," + fl + "," + row[6] + "," + row[7];
      if (!full && R.last.get(e.nid) === key) continue;
      R.last.set(e.nid, key);
      out.push(row);
    }
    if (out.length) msend({
      k: "es",
      s: R.seed,
      e: out
    });
  }
  function awCode(e) {
    const t = performance.now() / 1e3;
    return e.awBangAt && t - e.awBangAt < A.AW.bang ? 11 : e.awShow > 0 && e.awShow < 1 ? Math.max(1, Math.min(9, Math.round(e.awShow * 10))) : 0;
  }
  function onEnemySnap(d) {
    for (const a of d.e || []) {
      const e = A.enemies[a[0]];
      if (!e || !e.alive) continue;
      e.tx = a[1] / 100;
      e.ty = a[2] / 100;
      e.face = a[3] / 100;
      e.dir = A.dirOf(e.face);
      const fl = a[4];
      e.ai = fl & 1 ? "chase" : e.ai === "chase" ? "search" : e.ai;
      if (fl & 2) {
        if (e.type === "scav" && e.melee && SX.melee) {
          if (!e._swN) SX.melee.start(e, e.melee, e.face, "enemy");
        } else e.swing = Math.max(e.swing, .25);
      }
      e._swN = !!(fl & 2);
      if (fl & 4) e.muzzleT = Math.max(e.muzzleT, .06);
      if (fl & 8) e.flinch = Math.max(e.flinch, .12);
      e.sprinting = !!(fl & 16);
      e.laser = !!(fl & 32);
      if (e.laser) e.aimA = e.face;
      {
        const st = !!(fl & 64), gs = !!(fl & 128), TC = SX.tac;
        if (TC && TC.dazeSay) {
          if (st && !(e.stunT > 0)) TC.dazeSay(e, "stun"); else if (gs && !st && !(e.gasT > 0)) TC.dazeSay(e, "gas");
        }
        e.stunT = st ? 1 : 0;
        e.gasT = gs ? 1 : 0;
      }
      e.walkT = a[5] / 10;
      e.legT = e.walkT * (A.LEG_E || 1);
      e.frame = Math.floor(e.legT) % 4;
      if (a[6] != null && a[6] >= 0) e.hp = +a[6];
      if (a[7] != null) {
        const q = +a[7], t = performance.now() / 1e3;
        if (q === 11) {
          if (!(e.awBangAt && t - e.awBangAt < .8)) e.awBangAt = t;
          e.awShow = 0;
        } else e.awShow = q / 10;
      }
    }
  }
  function lerpEnemies(dt) {
    const pf = A.player ? A.player.floor : -1;
    for (const e of A.enemies) {
      if (e.dead) {
        e.deathT += dt;
        A.deathTick && A.deathTick(e);
        continue;
      }
      if (!e.alive || e.tx == null) continue;
      const dx = e.tx - e.x, dy = e.ty - e.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        e.x = e.tx;
        e.y = e.ty;
      } else {
        const k = Math.min(1, dt * 10);
        e.x += dx * k;
        e.y += dy * k;
      }
      e.flinch = Math.max(0, e.flinch - dt);
      e.swing = Math.max(0, e.swing - dt);
      e.kick = Math.max(0, e.kick - dt * 7);
      e.muzzleT -= dt;
      if (e.throwT > 0) e.throwT -= dt;
      if (e.gasT > 0 && SX.tac && SX.tac.dazeFx) SX.tac.dazeFx(e, dt);
      if (pf === e.floor && A.enemyStep) {
        const F = floorOf(e.floor);
        if (F) A.enemyStep(F, e);
      }
    }
  }
  const AT = v => v === "ap" || v === "hp" ? v : undefined;
  C.remoteHit = function(e, dmg, ang, crit, by, at, tk, hc, fx) {
    const R = R_();
    if (!R || R.auth === R.me || e.nid == null) return false;
    msend({
      k: "hit",
      s: R.seed,
      n: e.nid,
      d: Math.round(dmg * 10) / 10,
      a: r2(ang),
      c: crit ? 1 : 0,
      al: by && by.kind === "ally" ? 1 : 0,
      t: AT(at),
      tk: tk ? 1 : undefined,
      hk: hc ? hc.k : undefined,
      hr: hc ? r2(hc.r) : undefined,
      hq: hc ? hc.q | 0 : undefined,
      ht: hc ? Math.round(hc.t * 1e3) / 1e3 : undefined,
      hw: hc && hc.w ? String(hc.w).slice(0, 24) : undefined
    }, R.auth);
    const F = floorOf(e.floor);
    if (F) {
      if (!A.hitFx(F, e, ang, crit, fx, at)) A.bleed(F, e, ang, crit);
      if (crit) A.float(F.idx, e.x, e.y - 1.4, "치명!", "#ffd26a");
    }
    return true;
  };
  const HN = 32;
  function histRec() {
    const now = performance.now() / 1e3;
    for (const e of A.enemies) {
      if (!e.alive) continue;
      const h = e._hh || (e._hh = {
        t: new Float64Array(HN).fill(-1),
        x: new Float32Array(HN),
        y: new Float32Array(HN),
        i: 0
      });
      if (now - h.t[(h.i + HN - 1) % HN] < 1 / 60) continue;
      h.t[h.i] = now;
      h.x[h.i] = e.x;
      h.y[h.i] = e.y;
      h.i = (h.i + 1) % HN;
    }
  }
  function histAt(e, t) {
    const h = e._hh;
    if (!h) return null;
    let nj = -1;
    for (let k = 1; k <= HN; k++) {
      const j = (h.i - k + HN) % HN, tj = h.t[j];
      if (tj < 0) break;
      if (tj <= t) {
        if (nj < 0) return {
          x: e.x,
          y: e.y
        };
        const f = (t - tj) / Math.max(1e-6, h.t[nj] - tj);
        return {
          x: h.x[j] + (h.x[nj] - h.x[j]) * f,
          y: h.y[j] + (h.y[nj] - h.y[j]) * f
        };
      }
      nj = j;
    }
    return nj >= 0 ? {
      x: h.x[nj],
      y: h.y[nj]
    } : null;
  }
  C._histAt = histAt;
  C.rttOf = pid => {
    const R = R_();
    return R && R.rtt && R.rtt.get(pid) || 0;
  };
  C.victimDelay = pid => Math.min(C.rttOf(pid) + (1 / ES_HZ + 1 / ST_HZ) / 2 + 1 / 14, .2);
  const HIT_TOL = .05;
  function hitOk(from, g, e, F, d) {
    const R = C.raid, back = Math.min(C.rttOf(from) / 2 + .1, .25), pos = histAt(e, performance.now() / 1e3 - back) || e;
    if (g.floor !== e.floor) return false;
    const gx = g.tx != null ? g.tx : g.x, gy = g.ty != null ? g.ty : g.y;
    if (!(Math.hypot(gx - pos.x, gy - pos.y) <= (+d.hr || 0) + .5)) return false;
    if (d.hk === "g" ? !A.bulletClear(F, gx, gy - .1, pos.x, pos.y - .1) : !SX.light.los(F, gx, gy - .4, pos.x, pos.y - .4)) return false;
    const L = R.hitCd || (R.hitCd = new Map), key = from + ":" + d.hk, last = L.get(key), q = d.hq | 0, t = +d.ht || 0;
    if (last && last.q !== q) {
      const w = d.hw && (A.FIST && d.hw === A.FIST.name ? A.FIST : SX.items.def(d.hw)) || {}, cool = d.hk === "g" ? w.rof || 0 : w.cool || .6;
      if (t - last.t < cool - HIT_TOL) return false;
    }
    if (!last || last.q !== q) L.set(key, {
      q,
      t
    });
    return true;
  }
  function onHit(from, d) {
    const R = C.raid;
    if (R.auth !== R.me) return;
    const e = A.enemies[d.n];
    if (!e || !e.alive) return;
    const g = C.ghosts.get(from);
    const by = g ? d.al && g.ally ? g.ally : g : {
      kind: "peer",
      pid: from,
      x: e.x,
      y: e.y
    };
    const F = floorOf(e.floor);
    if (!F) return;
    if (d.hk && g && !d.al && !hitOk(from, g, e, F, d)) return;
    let dmg = d.d;
    if (d.tk && !(g && g.floor === e.floor && A.stealthOk && A.stealthOk(e, g.x, g.y))) dmg = Math.min(+dmg || 0, 60);
    A.damageEnemy(F, e, dmg, d.a, by, !!d.c, AT(d.t), d.hk ? {
      k: d.hk === "m" ? "m" : "g",
      w: typeof d.hw === "string" ? d.hw : null,
      q: d.hq | 0,
      src: from
    } : null);
  }
  C.hfxOut = function(e, ang, crit, P, src) {
    const R = R_();
    if (!R || R.auth !== R.me || e.nid == null || !P || !P.first) return;
    const Q = R.hfxQ || (R.hfxQ = []);
    if (Q.length >= 80) Q.shift();
    Q.push([ e.nid, r2(ang), crit ? 1 : 0, Math.round(P.kb * 100), src != null ? src : R.me, P.m ? 1 : 0 ]);
  };
  function hfxFlush(R) {
    if (R.hfxQ && R.hfxQ.length) msend({
      k: "hfx",
      s: R.seed,
      h: R.hfxQ.splice(0, 40)
    });
  }
  function onHfx(d) {
    const R = C.raid;
    if (!Array.isArray(d.h)) return;
    for (const h of d.h.slice(0, 40)) {
      if (!Array.isArray(h) || h[4] === R.me) continue;
      const e = A.enemies[h[0]];
      if (!e) continue;
      const F = floorOf(e.floor);
      if (!F) continue;
      A.hitFxDraw(F, e, +h[1] || 0, !!h[2], Math.min(.6, Math.max(0, (+h[3] || 0) / 100)), true, !!h[5]);
    }
  }
  C.enemyDied = function(e, ang, byEnemy, crit, by, items) {
    const R = R_();
    if (!R || e.nid == null || R.auth !== R.me) return;
    hfxFlush(R);
    const who = byEnemy ? -1 : by && by.kind === "peer" ? by.pid : R.me;
    msend({
      k: "kill",
      s: R.seed,
      n: e.nid,
      x: r2(e.x),
      y: r2(e.y),
      a: r2(ang),
      c: crit ? 1 : 0,
      be: byEnemy ? 1 : 0,
      by: who,
      it: items.map(Rd().nd)
    });
  };
  function onKill(d) {
    const e = A.enemies[d.n];
    if (!e || !e.alive) return;
    const F = floorOf(e.floor);
    if (!F) return;
    e.x = d.x;
    e.y = d.y;
    e.tx = null;
    const by = d.be ? null : {
      kind: d.by === C.raid.me ? "player" : "peer",
      pid: d.by
    };
    A.killEnemy(F, e, d.a, !!d.be, !!d.c, by, (d.it || []).map(Rd().nr));
  }
  C.hurtPeer = function(pid, dmg, src, head, ang, pvp, cal, fr, nid, ex, at) {
    if (typeof ex === "string") {
      at = ex;
      ex = null;
    }
    const R = R_();
    if (!R) return;
    msend({
      k: "hurt",
      s: R.seed,
      d: Math.round(dmg * 10) / 10,
      src,
      h: head ? 1 : 0,
      a: r2(ang || 0),
      by: pvp ? R.me : undefined,
      c: cal || undefined,
      f: pvp ? undefined : fr || undefined,
      n: pvp || nid == null ? undefined : nid,
      w: pvp && ex && ex.w ? String(ex.w).slice(0, 24) : undefined,
      r: pvp && ex && ex.r >= 0 ? Math.round(ex.r) : undefined,
      t: AT(at)
    }, pid);
    const g = C.ghosts.get(pid);
    if (g) {
      g.hurtT = .5;
      const F = floorOf(g.floor);
      if (F) A.bleedAt(F, g.x, g.y, ang);
    }
  };
  C.hurtPeerAlly = function(pid, dmg, ang) {
    const R = R_();
    if (!R) return;
    msend({
      k: "hurtAl",
      s: R.seed,
      d: Math.round(dmg * 10) / 10,
      a: r2(ang || 0)
    }, pid);
    const g = C.ghosts.get(pid), m = g && g.ally;
    if (m) {
      m.flinch = .18;
      const F = floorOf(m.floor);
      if (F) A.bleedAt(F, m.x, m.y, ang);
    }
  };
  let lastHitBy = null;
  function dodged(d) {
    if (d.n == null || d.by != null || d.c === "blast") return false;
    const e = A.enemies[d.n], p = A.player;
    if (!e || !e.alive || !p || !p.alive) return false;
    if (e.floor !== p.floor) return true;
    const F = floorOf(p.floor);
    if (!F) return false;
    const ex = e.tx != null ? e.tx : e.x, ey = e.tx != null ? e.ty : e.y;
    if (d.c === "melee") return false;
    return !SX.light.los(F, ex, ey - .1, p.x, p.y - .1) && !SX.light.los(F, e.x, e.y - .1, p.x, p.y - .1);
  }
  C._dodged = dodged;
  const pvpSrc = d => {
    const R = C.raid, nm = R && R.names.get(d.by) || "누군가";
    return nm + (d.c === "melee" ? " 에게 맞았습니다" : " 의 총에 맞았습니다");
  };
  function onHurt(d) {
    if (dodged(d)) return;
    if (d.by != null) lastHitBy = {
      gid: d.by,
      at: performance.now()
    };
    A.hurtPlayer(d.d, d.by != null ? pvpSrc(d) : d.src || "맞았습니다", !!d.h, d.a, d.c, d.by != null ? "player" : typeof d.f === "string" ? d.f.slice(0, 12) : null, hurtMeta(d), AT(d.t));
  }
  function hurtMeta(d) {
    const R = C.raid, p = A.player;
    if (d.by != null) return {
      pvp: {
        gid: d.by,
        name: R && R.names.get(d.by) || "#" + d.by,
        mate: !!(R && R.teams.get(d.by) === R.team)
      },
      w: typeof d.w === "string" ? d.w.slice(0, 24) : null,
      r: Number.isFinite(+d.r) ? Math.max(0, Math.min(200, +d.r)) : null
    };
    const e = d.n != null ? A.enemies[d.n] : null;
    return e ? {
      by: e,
      r: p ? Math.hypot(p.x - e.x, p.y - e.y) : null
    } : null;
  }
  function onHurtAlly(d) {
    const al = A.allies.find(a => a.alive);
    const F = al && floorOf(al.floor);
    if (al && F) A.hurtAlly(F, al, d.d, d.a);
  }
  C.shot = function(F, x, y, angs, g, range) {
    const R = R_();
    if (!R) return;
    msend({
      k: "shot",
      s: R.seed,
      f: F.idx,
      x: r2(x),
      y: r2(y),
      a: angs.map(r2),
      cls: g.cls || "pistol",
      q: g.quiet ? 1 : 0,
      r: range,
      v: A.gunVel(g),
      n: r2((g.quiet ? 7 : 30) * (g.fxNoise || 1)),
      z: g.fxFuzz || undefined
    });
  };
  function onShot(from, d) {
    const F = floorOf(d.f);
    if (!F) return;
    const g = C.ghosts.get(from);
    for (const a of d.a || []) A.shootVis(F, g || {
      kind: "peer"
    }, d.x, d.y, a, d.r || 44, d.v);
    if (A.player && A.player.floor === d.f) SX.audio.play(A.gunSound(d.cls, !!d.q), {
      x: d.x,
      y: d.y,
      range: 50,
      vol: d.q ? .6 : .9,
      verb: !!F.inside[F.i(Math.floor(d.x), Math.floor(d.y))]
    });
    SX.light.flash(F.idx, d.x, d.y, d.q ? 2 : 5, [ 255, 210, 130 ], .07);
    if (g) {
      g.muzzleT = .05;
      g.kick = 1;
      g.shotAt = A.clock;
    }
    if (C.raid.auth === C.raid.me) A.noise(F, d.x, d.y, (d.n > 0 ? Math.min(40, +d.n) : d.q ? 7 : 30) * (SX.wx ? SX.wx.shotMul(F, d.x, d.y) : 1), false, d.z > 0 ? Math.min(12, +d.z) : 0, true);
  }
  C.enemyShot = function(F, e, x, y, a, range, sup) {
    const R = R_();
    if (!R || R.auth !== R.me || e.nid == null) return;
    msend({
      k: "eshot",
      s: R.seed,
      n: e.nid,
      f: F.idx,
      x: r2(x),
      y: r2(y),
      a: Array.isArray(a) ? a.map(r2) : r2(a),
      v: A.gunVel(SX.items.def(e.gun)),
      r: range || undefined,
      q: sup ? 1 : undefined
    });
  };
  function onEShot(d) {
    const F = floorOf(d.f);
    if (!F) return;
    const e = A.enemies[d.n], sup = !!d.q, rg = d.r > 0 ? Math.min(90, +d.r) : 30;
    for (const a of Array.isArray(d.a) ? d.a.slice(0, 12) : [ d.a ]) A.shootVis(F, e || {
      kind: "enemy"
    }, d.x, d.y, +a || 0, rg, d.v);
    if (e) {
      e.muzzleT = sup ? .03 : .06;
      e.kick = 1;
    }
    if (A.player) SX.audio.play(A.gunSound(e && SX.items.def(e.gun), sup), {
      x: d.x,
      y: d.y,
      f: F.idx,
      range: sup ? 14 : 40,
      vol: sup ? .7 : .8,
      verb: !!F.inside[F.i(Math.floor(d.x), Math.floor(d.y))]
    });
    SX.light.flash(F.idx, d.x, d.y, sup ? 1.5 : 4.5, [ 255, 200, 120 ], .07);
  }
  C.nade = function(n) {
    const R = R_();
    if (!R || n.remote) return;
    if (n.from && n.from.kind === "enemy" && R.auth !== R.me) return;
    msend({
      k: "nade",
      s: R.seed,
      f: n.floor,
      x: r2(n.x),
      y: r2(n.y),
      z: n.z,
      vx: r2(n.vx),
      vy: r2(n.vy),
      vz: n.vz,
      fuse: n.fuse,
      dmg: n.dmg,
      rad: n.radius,
      sub: n.sub || null,
      dur: n.dur || 0,
      fe: n.from && n.from.kind === "enemy" ? n.from.nid : null
    });
  };
  function onNade(from, d) {
    const g = C.ghosts.get(from), fe = d.fe != null ? A.enemies[d.fe] : null;
    A.nades.push({
      floor: d.f,
      x: d.x,
      y: d.y,
      z: d.z,
      vx: d.vx,
      vy: d.vy,
      vz: d.vz,
      fuse: d.fuse,
      from: fe || g || null,
      dmg: d.dmg,
      radius: d.rad,
      remote: true,
      sub: d.sub === "flash" || d.sub === "gas" || d.sub === "smoke" || d.sub === "fire" ? d.sub : null,
      dur: +d.dur || 0
    });
    const tq = SX.tac && SX.tac.THROW_Q || .19;
    if (fe && fe.alive) {
      fe.throwT = tq;
      A.say(fe, "수류탄!", "#ff9a6a");
    } else if (g) g.throwT = tq;
  }
  const num = (v, dflt) => Number.isFinite(+v) ? +v : dflt;
  C.brick = function(b) {
    const R = R_();
    if (!R || !b || b.remote) return;
    msend({
      k: "brick",
      s: R.seed,
      f: b.floor,
      x: r2(b.x),
      y: r2(b.y),
      z: b.z,
      vx: r2(b.vx),
      vy: r2(b.vy),
      vz: b.vz,
      sp: r2(b.spin || 0)
    });
  };
  function onBrick(from, d) {
    if (!floorOf(d.f)) return;
    A.thrown.push({
      floor: d.f,
      x: num(d.x, 0),
      y: num(d.y, 0),
      z: num(d.z, .9),
      vx: num(d.vx, 0),
      vy: num(d.vy, 0),
      vz: num(d.vz, 0),
      t: 0,
      spin: num(d.sp, 0),
      ang: 0,
      remote: true
    });
    const g = C.ghosts.get(from);
    if (g) g.throwT = SX.tac && SX.tac.THROW_Q || .19;
  }
  C.noise = function(F, x, y, r, quiet, fuzz) {
    const R = R_();
    if (!R || R.auth === R.me || C.applying || !F || !(r > 0)) return;
    msend({
      k: "nz",
      s: R.seed,
      f: F.idx,
      x: r2(x),
      y: r2(y),
      r: r2(r),
      q: quiet ? 1 : 0,
      z: fuzz || undefined
    }, R.auth);
  };
  function onNoise(d) {
    const R = C.raid;
    if (R.auth !== R.me) return;
    const F = floorOf(d.f), r = Math.min(60, num(d.r, 0));
    if (!F || !(r > 0)) return;
    A.noise(F, num(d.x, 0), num(d.y, 0), r, !!d.q, Math.min(12, Math.max(0, num(d.z, 0))), true);
  }
  C.efx = function(e, snd, opt, text, col) {
    const R = R_();
    if (!R || R.auth !== R.me || !e || e.nid == null) return;
    const far = (opt && opt.range || 20) + 8;
    let any = false;
    for (const g of C.ghosts.values()) if (g.alive && Math.hypot(g.x - e.x, g.y - e.y) < far) {
      any = true;
      break;
    }
    if (!any) return;
    msend({
      k: "efx",
      s: R.seed,
      n: e.nid,
      a: snd || undefined,
      o: opt ? [ opt.range || 0, opt.vol == null ? 1 : opt.vol, opt.r || 0 ] : undefined,
      t: text || undefined,
      c: col || undefined
    });
  };
  function onEfx(from, d) {
    const R = C.raid;
    if (from !== R.auth) return;
    const e = A.enemies[d.n];
    if (!e || !e.alive) return;
    if (typeof d.t === "string" && d.t) A.say(e, d.t.slice(0, 24), typeof d.c === "string" && /^#[0-9a-fA-F]{3,8}$/.test(d.c) ? d.c : undefined);
    if (typeof d.a === "string" && /^[A-Za-z0-9_]{1,24}$/.test(d.a)) {
      const o = Array.isArray(d.o) ? d.o : [], opt = {
        x: e.x,
        y: e.y,
        f: e.floor,
        range: Math.min(80, num(o[0], 0)) || 20,
        vol: Math.min(1.5, Math.max(0, num(o[1], 1)))
      };
      if (num(o[2], 0) > 0) opt.r = Math.min(2, num(o[2], 1));
      SX.audio.play(d.a, opt);
      if (d.a === "doorBash" && A.bashShake) A.bashShake(e);
    }
  }
  C.knock = function(pid, ang, dist) {
    const R = R_();
    if (!R) return;
    msend({
      k: "knock",
      s: R.seed,
      a: r2(ang),
      d: r2(dist)
    }, pid);
  };
  function onKnock(d) {
    const p = A.player, F = p && floorOf(p.floor);
    if (!p || !p.alive || !F) return;
    A.knockBack(F, p, num(d.a, 0), Math.min(3, Math.max(0, num(d.d, 0))));
  }
  C.door = function(F, d) {
    const R = R_();
    if (!R || C.applying) return;
    const i = F.doors.indexOf(d);
    if (i < 0) return;
    msend({
      k: "door",
      s: R.seed,
      f: F.idx,
      i,
      o: d.open ? 1 : 0,
      u: d.locked || d.exit ? undefined : 1
    });
  };
  C.heli = function() {
    const R = R_();
    if (!R) return;
    msend({
      k: "heli",
      s: R.seed,
      t: Rd().heli && Rd().heli.t0 != null ? r2(Rd().heli.t0) : undefined
    });
  };
  C.stair = function(F, s) {
    const R = R_();
    if (!R) return;
    const i = F.stairs.indexOf(s);
    if (i < 0) return;
    msend({
      k: "stair",
      s: R.seed,
      f: F.idx,
      i
    });
  };
  C.trap = function(F, t) {
    const R = R_();
    if (!R || !F.traps) return;
    const i = F.traps.indexOf(t);
    if (i < 0) return;
    msend({
      k: "trap",
      s: R.seed,
      f: F.idx,
      i,
      st: t.st,
      id: t.id || undefined
    });
  };
  function onTrap(d) {
    const F = floorOf(d.f);
    if (F && SX.traps) SX.traps.apply(F, d.i, d.st | 0, typeof d.id === "string" ? d.id : null);
  }
  C.trapPlace = function(F, t) {
    const R = R_();
    if (!R || !t || !t.id || !SX.traps) return;
    msend({
      k: "tplace",
      s: R.seed,
      f: F.idx,
      t: SX.traps.pack(t)
    });
  };
  function onTrapPlace(from, d) {
    const R = C.raid, F = floorOf(d.f);
    if (!F || !SX.traps || !d.t) return;
    const n0 = F.traps ? F.traps.length : 0, t = SX.traps.addRemote(F, d.t, from, R.teams.get(from) === R.team);
    if (t && F.traps && F.traps.length > n0 && A.player && A.player.floor === F.idx) {
      const c = SX.traps.center(t);
      SX.audio.play("trapArm", {
        wire: t.kind === "wire",
        x: c.x,
        y: c.y,
        range: 12,
        vol: .7
      });
    }
  }
  function onStair(d) {
    const F = floorOf(d.f), st = F && F.stairs[d.i];
    if (!st || !st.locked) return;
    Rd().unlockStair(F, st, true);
    SX.log("🔓 같이 하는 사람이 " + (d.f + 1) + "층 계단을 열었습니다", "good");
  }
  function onDoor(d) {
    const F = floorOf(d.f);
    if (!F) return;
    const dr = F.doors[d.i];
    if (!dr) return;
    if (dr.locked) {
      if (!d.u || dr.exit) return;
      dr.locked = false;
    }
    if (!d.o && A.anyOn(F, dr)) return;
    const was = dr.open;
    C.applying = true;
    try {
      dr.open = !!d.o;
    } finally {
      C.applying = false;
    }
    if (was !== dr.open && A.player && A.player.floor === d.f) SX.audio.play(dr.open ? "doorOpen" : "doorClose", {
      x: dr.cx,
      y: dr.cy,
      range: 16,
      vol: .7,
      mat: SX.doorPlace && SX.doorPlace.mat(F, dr)
    });
  }
  function fixReveal(c) {
    if (c.revealed != null && c.revealed > c.grid.list.length) c.revealed = c.grid.list.length;
  }
  const pend = new Set;
  const pendT = new Map;
  const lastTake = new Map;
  let takeN = 0;
  C.tookOut = function(g, it) {
    const R = R_();
    if (!R || C.applying || R.auth === R.me || !g || !g.shared || !it) return;
    pendT.set(it.id, [ g.shared, Date.now() ]);
  };
  C.pending = function(it) {
    if (!it || !pendT.size) return false;
    const p = pendT.get(it.id);
    if (!p) return false;
    if (Date.now() - p[1] > 4e3 || !R_()) {
      pendT.delete(it.id);
      return false;
    }
    return true;
  };
  C.touch = function(g) {
    if (C.applying || !R_() || !g.shared) return;
    if (!g._pre) {
      g._pre = new Set(g.list.map(e => e.it.id));
      pend.add(g);
      if (pend.size === 1) queueMicrotask(flush);
    }
  };
  function flush() {
    const list = [ ...pend ];
    pend.clear();
    const R = R_();
    for (const g of list) {
      const pre = g._pre;
      g._pre = null;
      if (!R) continue;
      const now = new Map(g.list.map(e => [ e.it.id, e ]));
      const key = g.shared;
      let changed = false;
      for (const id of pre) if (!now.has(id)) {
        changed = true;
        if (R.auth !== R.me) {
          msend({
            k: "take",
            s: R.seed,
            key,
            id,
            n: ++takeN
          }, R.auth);
          pendT.set(id, [ key, Date.now() ]);
          lastTake.set(id, takeN);
        }
      }
      for (const id of now.keys()) {
        const p = pendT.get(id);
        if (p && p[0] === key) pendT.delete(id);
      }
      for (const [id, e] of now) if (!pre.has(id)) {
        changed = true;
        if (R.auth !== R.me) msend({
          k: "put",
          s: R.seed,
          key,
          it: Rd().nd(e.it),
          x: e.x,
          y: e.y,
          r: e.it.rot ? 1 : 0
        }, R.auth);
      }
      if (changed && R.auth === R.me) bcastGrid(key);
    }
  }
  function bcastGrid(key) {
    const R = R_(), c = Rd().conts.get(key);
    if (!R || !c) return;
    msend({
      k: "cg",
      s: R.seed,
      key,
      g: Rd().gd(c.grid)
    });
  }
  function onTake(from, d) {
    const R = C.raid;
    if (R.auth !== R.me) return;
    const c = Rd().conts.get(d.key);
    const e = c && c.grid.list.find(q => q.it.id === d.id);
    if (!e) {
      R.denied.add(from + ":" + d.id);
      msend({
        k: "deny",
        s: R.seed,
        id: d.id
      }, from);
      if (c) msend({
        k: "cg",
        s: R.seed,
        key: d.key,
        g: Rd().gd(c.grid)
      }, from);
      return;
    }
    C.applying = true;
    try {
      I.take(c.grid, e.it);
    } finally {
      C.applying = false;
    }
    R.denied.delete(from + ":" + d.id);
    fixReveal(c);
    SX.ui.contChanged && SX.ui.contChanged(c);
    bcastGrid(d.key);
    if (d.n != null) msend({
      k: "tok",
      s: R.seed,
      id: d.id,
      n: d.n
    }, from);
  }
  function onTok(d) {
    if (lastTake.get(d.id) !== d.n) return;
    if (SX.ui.isDragging && SX.ui.isDragging()) {
      setTimeout(() => {
        if (C.raid) onTok(d);
      }, 250);
      return;
    }
    lastTake.delete(d.id);
    pendT.delete(d.id);
    const kit = SX.game.kit, it = kit && I.kitFind(kit, d.id), g = it && I.kitGrids(kit).find(q => I.at(q, it));
    if (!g) return;
    let n = 0;
    for (const q of I.kitGrids(kit)) {
      const r = I.fillSame(q, it);
      if (r.moved) n++;
      if (r.moved && !r.left) {
        I.take(g, it);
        kit.quick = kit.quick.map(x => x === it.id ? null : x);
        break;
      }
    }
    if (n) {
      SX.ui.refresh && SX.ui.refresh();
      SX.ui.hudDirty && SX.ui.hudDirty();
    }
  }
  function onPut(from, d) {
    const R = C.raid;
    if (R.auth !== R.me) return;
    const c = Rd().conts.get(d.key);
    if (!c || !d.it) return;
    if (R.denied.has(from + ":" + d.it.id)) return;
    if (c.grid.list.some(q => q.it.id === d.it.id)) return;
    const it = Rd().nr(d.it);
    C.applying = true;
    try {
      if (!I.put(c.grid, it, d.x, d.y, !!d.r)) I.putGrow(c.grid, it);
    } finally {
      C.applying = false;
    }
    SX.ui.contChanged && SX.ui.contChanged(c);
    bcastGrid(d.key);
  }
  function onCg(d) {
    const R = C.raid, c = Rd().conts.get(d.key);
    if (!c) return;
    if (SX.ui.isDragging && SX.ui.isDragging()) {
      R.cgQ.set(d.key, d);
      return;
    }
    applyGrid(c, d.g, d.key);
  }
  function applyGrid(c, dg, key) {
    const r = Rd().gr(dg);
    if (pendT.size && key != null) {
      const ids = new Set(r.list.map(e => e.it.id));
      for (const [id, p] of pendT) if (p[0] === key && !ids.has(id)) pendT.delete(id);
    }
    C.applying = true;
    try {
      c.grid.cols = r.cols;
      c.grid.rows = r.rows;
      c.grid.list = r.list;
    } finally {
      C.applying = false;
    }
    fixReveal(c);
    SX.ui.contChanged && SX.ui.contChanged(c);
  }
  function onDeny(d) {
    const kit = SX.game.kit;
    pendT.delete(d.id);
    lastTake.delete(d.id);
    let it = I.kitAll(kit).find(q => q.id === d.id), where = null;
    if (!it) for (const c of Rd().conts.values()) {
      const e = c.grid.list.find(q => q.it.id === d.id);
      if (e) {
        it = e.it;
        where = c;
        break;
      }
    }
    if (!it && SX.vault) for (const g of SX.vault.grids(SX.game.save)) {
      const e = g.list.find(q => q.it.id === d.id);
      if (e) {
        it = e.it;
        where = {
          grid: g
        };
        break;
      }
    }
    if (!it) for (const g of I.kitGrids(kit)) for (const e of g.list) {
      const inner = e.it.grid && e.it.grid.list.find(q => q.it.id === d.id);
      if (inner && !it) {
        it = inner.it;
        where = {
          grid: e.it.grid
        };
      }
    }
    if (!it) return;
    C.applying = true;
    try {
      if (where) I.take(where.grid, it); else I.kitTake(kit, it);
    } finally {
      C.applying = false;
    }
    SX.log("🌐 한발 늦었습니다 — " + it.name + " 은(는) 누가 먼저 가져갔습니다", "bad");
    SX.audio.play("denied");
    SX.ui.refresh();
    SX.ui.hudDirty();
  }
  C.modSig = g => (SX.PART_SLOTS || []).map(s => g && g.mods && g.mods[s] ? g.mods[s].name : "").join("|");
  C.modGun = function(grid, gun, undo) {
    const R = R_();
    if (!R || !grid || !grid.shared || !gun) return;
    if (R.auth === R.me) {
      bcastGrid(grid.shared);
      return;
    }
    R.modN = (R.modN | 0) + 1;
    (R.modPend || (R.modPend = new Map)).set(R.modN, undo);
    const m = {
      k: "mod",
      s: R.seed,
      key: grid.shared,
      id: gun.id,
      it: JSON.parse(JSON.stringify(Rd().nd(gun))),
      prev: undo.prev,
      op: R.modN
    }, to = R.auth;
    queueMicrotask(() => msend(m, to));
  };
  function onMod(from, d) {
    const R = C.raid;
    if (R.auth !== R.me) return;
    const c = Rd().conts.get(d.key), e = c && c.grid.list.find(q => q.it.id === d.id), n = d.it;
    const partsOk = !!n && !!e && Object.keys(n.mods || {}).every(s => {
      const m = n.mods[s];
      return m && m.kind === "part" && SX.partDef(m) && SX.partDef(m).slot === s && SX.partFits(m, e.it);
    });
    const stolen = !!n && Object.values(n.mods || {}).some(m => m && R.denied.has(from + ":" + m.id));
    if (!e || !n || e.it.kind !== "gun" || n.name !== e.it.name || n.id !== d.id || C.modSig(e.it) !== d.prev || !partsOk || stolen) {
      msend({
        k: "modno",
        s: R.seed,
        op: d.op
      }, from);
      if (c) msend({
        k: "cg",
        s: R.seed,
        key: d.key,
        g: Rd().gd(c.grid)
      }, from);
      return;
    }
    const it = Rd().nr(n);
    it.rot = e.it.rot;
    C.applying = true;
    try {
      e.it = it;
    } finally {
      C.applying = false;
    }
    SX.ui.contChanged && SX.ui.contChanged(c);
    bcastGrid(d.key);
  }
  function onModNo(d) {
    const R = C.raid, u = R.modPend && R.modPend.get(d.op);
    if (!u) return;
    R.modPend.delete(d.op);
    const kit = SX.game.kit;
    C.applying = true;
    try {
      for (const id of u.gained || []) {
        const it = I.kitAll(kit).find(q => q.id === id);
        if (it) I.kitTake(kit, it);
      }
      for (const o of u.lost || []) {
        const it = Rd().nr(o);
        I.kitStow(kit, it);
      }
    } finally {
      C.applying = false;
    }
    SX.log("🌐 한발 늦었습니다 — 그 총은 누가 먼저 만졌습니다", "bad");
    SX.audio.play("denied");
    SX.ui.refresh();
    SX.ui.hudDirty();
  }
  C.newCont = function(pr, meta) {
    const R = R_();
    if (!R || !pr || !pr.cont) return;
    msend({
      k: "nc",
      s: R.seed,
      meta,
      g: Rd().gd(pr.cont.grid)
    });
  };
  function onNewCont(d) {
    const meta = d.meta;
    if (!meta || Rd().conts.has(meta.key)) return;
    Rd().worldApply({
      extras: [ meta ],
      conts: [ [ meta.key, d.g, 1, 0 ] ]
    });
  }
  C.died = function() {
    const R = R_(), p = A.player;
    if (!R || !p) return;
    const G = SX.game, kit = G.kit, items = [];
    const insured = !!(G.insuredList && G.insuredList.length);
    for (const s of [ "w1", "w2", "melee", "armor", "helmet", "bag", "rig", "nvg" ]) {
      const it = kit[s];
      if (!it) continue;
      if (insured && s !== "nvg") {
        if (it.grid) for (const e of it.grid.list) items.push(Rd().nd(e.it));
      } else items.push(Rd().nd(it));
    }
    const killer = lastHitBy && performance.now() - lastHitBy.at < 4e3 ? lastHitBy.gid : null;
    lastHitBy = null;
    R.myDead = {
      x: p.x,
      y: p.y,
      f: p.floor,
      a: p.aim || 0,
      it: items
    };
    msend({
      k: "dead",
      s: R.seed,
      x: r2(p.x),
      y: r2(p.y),
      f: p.floor,
      it: items,
      by: killer
    });
  };
  function onDead(from, d) {
    const R = C.raid, g = C.ghosts.get(from);
    const F = floorOf(d.f);
    if (!F) return;
    if (g) {
      g.alive = false;
      g.down = null;
    }
    const key = "p" + from;
    const nm = R.names.get(from) || "누군가";
    if (!Rd().conts.has(key)) {
      const meta = {
        key,
        f: d.f,
        kind: "corpse",
        type: "corpse",
        x: SX.clamp(Math.floor(d.x), 0, F.W - 1),
        y: SX.clamp(Math.floor(d.y), 0, F.H - 1),
        px: d.x - .5,
        py: d.y - .5,
        flipX: !!(g && Math.cos(g.aim || 0) > 0),
        name: nm + " 의 짐",
        body: "p" + from,
        spec: g ? g.spec : null,
        live: 1
      };
      const grid = {
        cols: 4,
        rows: 4,
        list: []
      };
      const tmp = I.grid(4, 4);
      for (const it of (d.it || []).map(Rd().nr)) I.putGrow(tmp, it);
      grid.cols = tmp.cols;
      grid.rows = tmp.rows;
      grid.list = tmp.list.map(e => ({
        x: e.x,
        y: e.y,
        it: Rd().nd(e.it)
      }));
      Rd().worldApply({
        extras: [ meta ],
        conts: [ [ key, grid, 1, 0 ] ]
      });
    }
    const mate = R.teams.get(from) === R.team;
    if (d.by === R.me) {
      SX.game.stats.kills++;
      SX.log("🎯 " + nm + " 을(를) 쓰러뜨렸습니다 — 짐을 챙기십시오", "good");
    } else SX.log("🌐 " + nm + (mate ? "(우리 팀)" : "(적 팀)") + " 이(가) 쓰러졌습니다 — 짐이 그 자리에 남았습니다", mate ? "bad" : "warn");
    dirty();
  }
  function onSync(from) {
    const R = C.raid;
    if (R.auth !== R.me) return;
    msend({
      k: "world",
      s: R.seed,
      w: Rd().worldDump()
    }, from);
  }
  function onWorld(d) {
    Rd().worldApply(d.w, {
      search: false
    });
    SX.log("🌐 판 모습을 받았습니다", "good");
  }
  C.DOWN_T = 60;
  C.DOWN_HP = 30;
  C.REVIVE_T = 3;
  C.REVIVE_HP = 30;
  C.REVIVE_D = 1.3;
  C.CRAWL_SPD = .8;
  const rname = gid => C.raid && C.raid.names.get(gid) || C.nameOf(gid);
  C.mates = function() {
    const out = [];
    if (!R_()) return out;
    for (const g of C.ghosts.values()) if (g.mate && g.alive) out.push(g);
    return out;
  };
  C.canDown = function() {
    const p = A.player;
    return !!(R_() && p && p.alive && !p.down && !(SX.course && SX.course.on) && C.mates().length);
  };
  C.goDown = function(why) {
    const p = A.player;
    if (!p || !p.alive || p.down) return;
    p.down = {
      t: C.DOWN_T,
      hp: C.DOWN_HP,
      why: why || "쓰러졌습니다",
      rv: 0,
      rvBy: null,
      rvAt: 0
    };
    p.hp = 0;
    p.reload = null;
    p.use = null;
    p.sprinting = false;
    p.crouch = false;
    p.boxOn = false;
    p.swing = 0;
    p.kick = 0;
    p.muzzleT = 0;
    p.keyT = 0;
    p.typeT = 0;
    p.moving = false;
    p.frame = 0;
    p.walkT = 0;
    p.throwJob = null;
    p.throwT = 0;
    p.aimHeld = false;
    if (SX.vault && SX.vault.cancelUnlock) SX.vault.cancelUnlock();
    if (SX.tac && SX.tac.put) SX.tac.put();
    C.stopRevive();
    SX.audio.play("bodyFall", {
      vol: .8
    });
    SX.log("💀 " + p.down.why + " — 쓰러졌습니다. 동료가 곁에서 [" + SX.label("interact") + "] 를 붙잡으면 일어납니다(" + C.DOWN_T + "초 안에 · 더 맞으면 의식을 잃습니다)", "bad");
    if (SX.ui.closePanel) SX.ui.closePanel();
    dirty();
  };
  C.downTick = function(dt, F, ctl) {
    const p = A.player, d = p && p.down;
    if (!d) return;
    if (!C.raid) {
      C.downDie(d.why);
      return;
    }
    const was = Math.ceil(d.t);
    d.t -= dt;
    if (d.rvBy != null && performance.now() - d.rvAt > 800) {
      d.rvBy = null;
      d.rv = 0;
    }
    const In = SX.input;
    let mx = 0, my = 0;
    if (ctl && F) {
      if (In.held("up")) my -= 1;
      if (In.held("down")) my += 1;
      if (In.held("left")) mx -= 1;
      if (In.held("right")) mx += 1;
    }
    const ml = Math.hypot(mx, my);
    p.sprinting = false;
    p.aimHeld = false;
    p.moving = ml > 0 && !!F && A.move(F, p, mx / ml * C.CRAWL_SPD * dt, my / ml * C.CRAWL_SPD * dt);
    if (p.moving) {
      p.walkT += dt * 2.2;
      p.frame = Math.floor(p.walkT) % 4;
      p.stepT -= dt;
      if (p.stepT <= 0) {
        p.stepT = .9;
        SX.audio.play("step", {
          vol: .4,
          w: .3,
          kind: "zombie",
          surface: SX.audio.surfOf ? SX.audio.surfOf(SX.sndPlace ? SX.sndPlace.fsAt(F, p.x, p.y) : F.fs[F.i(Math.floor(p.x), Math.floor(p.y))]) : "conc"
        });
        A.noise(F, p.x, p.y, 2, true, 0, true);
      }
    } else {
      p.frame = 0;
      p.walkT = 0;
    }
    p.aim = Math.atan2(SX.view.mouseWorldY - (p.y - .55), SX.view.mouseWorldX - p.x);
    p.dir = A.dirOf(p.aim);
    if (d.t <= 0) {
      C.downDie(d.why);
      return;
    }
    if (Math.ceil(d.t) !== was) dirty();
  };
  C.downHurt = function(dmg, why) {
    const p = A.player, d = p && p.down;
    if (!d || !(dmg > 0)) return;
    d.hp -= dmg;
    dirty();
    if (d.hp <= 0) C.downDie(why || d.why);
  };
  C.downDie = function(why) {
    const p = A.player;
    if (!p || !p.down) return;
    p.down = null;
    p.hp = 0;
    p.alive = false;
    p.moving = false;
    SX.game.playerDied(why || "쓰러진 채 의식을 잃었습니다");
  };
  C.reviveTarget = function(F, p) {
    if (!R_() || !p || !p.alive || p.down || !F) return null;
    let best = null, bd = C.REVIVE_D;
    for (const g of C.ghosts.values()) {
      if (!g.mate || !g.alive || !g.down || g.floor !== F.idx) continue;
      const d = Math.hypot(g.x - p.x, g.y - p.y);
      if (d < bd) {
        bd = d;
        best = g;
      }
    }
    if (!best) return null;
    return {
      kind: "revive",
      g: best,
      x: best.x,
      y: best.y - .8,
      label: "🤝 " + best.name + " 일으키기 — " + C.REVIVE_T + "초 붙잡기"
    };
  };
  C.reviveStart = function(g) {
    const p = A.player;
    if (!g || !g.down || !g.alive || !p || !p.alive || p.down || C.job) return false;
    C.job = {
      gid: g.pid,
      g,
      t: 0,
      sT: 0
    };
    p.reviving = g.pid;
    p.reload = null;
    p.use = null;
    if (SX.tac && SX.tac.put) SX.tac.put();
    SX.audio.play("bandage", {
      vol: .7
    });
    return true;
  };
  C.stopRevive = function() {
    if (!C.job) return;
    C.job = null;
    if (A.player) A.player.reviving = null;
  };
  function reviveTick(dt) {
    const j = C.job;
    if (!j) return;
    const p = A.player, g = C.ghosts.get(j.gid), R = C.raid;
    const ok = g && g === j.g && g.alive && g.down && p && p.alive && !p.down && g.floor === p.floor && Math.hypot(g.x - p.x, g.y - p.y) <= C.REVIVE_D + .3 && SX.input.held("interact") && !(SX.ui.isOpen && SX.ui.isOpen());
    if (!ok) {
      C.stopRevive();
      return;
    }
    j.t += dt;
    j.cT = (j.cT || 0) - dt;
    if (j.cT <= 0) {
      j.cT = .9;
      SX.audio.play("rustle", {
        vol: .5
      });
    }
    j.sT -= dt;
    if (j.sT <= 0) {
      j.sT = .25;
      msend({
        k: "rv",
        s: R.seed,
        p: r2(Math.min(1, j.t / C.REVIVE_T))
      }, j.gid);
    }
    if (j.t < C.REVIVE_T) return;
    msend({
      k: "revive",
      s: R.seed
    }, j.gid);
    g.down = null;
    SX.log("🤝 " + g.name + " 을(를) 일으켰습니다", "good");
    SX.audio.play("reviveDone", {
      vol: .8
    });
    SX.audio.play("heal", {
      vol: .6,
      delay: .5
    });
    C.stopRevive();
    dirty();
  }
  function onRv(from, d) {
    const p = A.player, q = p && p.down;
    if (!q) return;
    q.rv = Math.max(0, Math.min(1, num(d.p, 0)));
    q.rvBy = from;
    q.rvAt = performance.now();
    if (!(q.rvSnd > q.rvAt - 900)) {
      q.rvSnd = q.rvAt;
      SX.audio.play("rustle", {
        vol: .5
      });
    }
  }
  function onRevive(from) {
    const p = A.player;
    if (!p || !p.down || !p.alive) return;
    p.down = null;
    p.hp = C.REVIVE_HP;
    p.hurtT = 0;
    p.st = Math.max(p.st, 30);
    SX.log("🤝 " + rname(from) + " 이(가) 일으켜 줬습니다 — 체력 " + C.REVIVE_HP + ". 출혈이 있으면 지혈부터 하십시오", "good");
    SX.audio.play("reviveDone", {
      vol: .8
    });
    SX.audio.play("heal", {
      vol: .6,
      delay: .5
    });
    dirty();
  }
  C.startSpec = function() {
    const R = R_(), p = A.player;
    if (!R || !p || p.alive) return false;
    const m = C.mates();
    if (!m.length) return false;
    myCorpse();
    C.spec = {
      gid: m[0].pid
    };
    p.spect = true;
    p.torch = false;
    if (SX.ui.closePanel) SX.ui.closePanel();
    SX.log("👁 " + rname(m[0].pid) + " 을(를) 보고 있습니다 — 동료가 모두 나가거나 쓰러지면 결과가 나옵니다");
    dirty();
    return true;
  };
  C.specCycle = function(step) {
    const s = C.spec, m = C.mates();
    if (!s || !m.length) return;
    const k = Math.max(0, m.findIndex(g => g.pid === s.gid));
    s.gid = m[(k + (step | 0) + m.length) % m.length].pid;
    SX.audio.play("click");
    dirty();
  };
  C.specName = () => C.spec ? rname(C.spec.gid) : "";
  C.specLeave = function() {
    const R = Rd();
    if (!C.spec || !R.on || R.over) return;
    SX.audio.play("click");
    R.end(false, SX.game.deathWhy || "쓰러졌습니다");
  };
  function specTick() {
    const s = C.spec, p = A.player;
    if (!s || !p) return;
    let g = C.ghosts.get(s.gid);
    if (!g || !g.mate || !g.alive) {
      const m = C.mates();
      g = m[0] || null;
      if (!g) return;
      s.gid = g.pid;
      dirty();
    }
    if (p.floor !== g.floor) {
      p.floor = g.floor;
      p.x = g.x;
      p.y = g.y;
      SX.light.box = null;
      SX.view.snap();
    }
    p.x = g.x;
    p.y = g.y;
    p.aim = g.aim || 0;
    p.dir = g.dir | 0;
  }
  function myCorpse() {
    const R = C.raid, md = R && R.myDead, p = A.player;
    if (!md) return;
    const F = floorOf(md.f), key = "p" + R.me;
    if (!F || Rd().conts.has(key)) return;
    const meta = {
      key,
      f: md.f,
      kind: "corpse",
      type: "corpse",
      x: SX.clamp(Math.floor(md.x), 0, F.W - 1),
      y: SX.clamp(Math.floor(md.y), 0, F.H - 1),
      px: md.x - .5,
      py: md.y - .5,
      flipX: Math.cos(md.a || 0) > 0,
      name: "내 짐",
      body: key,
      spec: p.spec,
      live: 0
    };
    const tmp = I.grid(4, 4);
    for (const it of (md.it || []).map(Rd().nr)) I.putGrow(tmp, it);
    Rd().worldApply({
      extras: [ meta ],
      conts: [ [ key, {
        cols: tmp.cols,
        rows: tmp.rows,
        list: tmp.list.map(e => ({
          x: e.x,
          y: e.y,
          it: Rd().nd(e.it)
        }))
      }, 1, 0 ] ]
    });
  }
  const teamGids = () => {
    const R = R_(), out = [];
    if (R) for (const [gid, tm] of R.teams) if (gid !== R.me && tm === R.team) out.push(gid);
    return out;
  };
  function teamSend(d) {
    const R = R_();
    if (!R) return;
    d.s = R.seed;
    for (const gid of teamGids()) msend(d, gid);
  }
  const sameTeam = from => {
    const R = C.raid;
    return !!R && from !== R.me && R.teams.has(from) && R.teams.get(from) === R.team;
  };
  C.pingMe = () => {
    const R = R_();
    return R ? R.me : null;
  };
  C.ping = function(a, q) {
    teamSend(a ? {
      k: "png",
      a: 1,
      id: q.id,
      f: q.f,
      x: r2(q.x),
      y: r2(q.y)
    } : {
      k: "png",
      a: 0,
      id: q.id
    });
  };
  function pingIn(P, from, id, f, x, y) {
    const lv = Rd().level;
    f = f | 0;
    x = +x;
    y = +y;
    if (!lv || !lv.floors[f] || !isFinite(x) || !isFinite(y) || P.some(q => q.id === id)) return false;
    P.push({
      f,
      x,
      y,
      t: Rd().t,
      id,
      by: from
    });
    const own = P.filter(q => q.by === from);
    if (own.length > 3) P.splice(P.indexOf(own[0]), 1);
    return true;
  }
  function onPng(from, d) {
    if (!sameTeam(from)) return;
    const P = Rd().pings, id = typeof d.id === "string" ? d.id.slice(0, 32) : null;
    if (!P || !id) return;
    if (!d.a) {
      const k = P.findIndex(q => q.id === id);
      if (k >= 0) P.splice(k, 1);
      return;
    }
    if (pingIn(P, from, id, d.f, d.x, d.y)) SX.audio.play("beep", {
      hi: true,
      vol: .35
    });
  }
  function teamHi(from) {
    const R = R_();
    if (!R || !sameTeam(from)) return;
    const l = Rd().pings.filter(q => q.id != null).slice(-12).map(q => [ q.id, q.f, r2(q.x), r2(q.y), q.by ]);
    msend({
      k: "pings",
      s: R.seed,
      l
    }, from);
    if (Rd().ctrlDone) msend({
      k: "ctl",
      s: R.seed
    }, from);
  }
  function onPings(from, d) {
    const R = C.raid;
    if (!sameTeam(from) || !Array.isArray(d.l)) return;
    const P = Rd().pings.filter(q => q.id == null || q.by === R.me);
    for (const r of d.l.slice(0, 12)) {
      if (!Array.isArray(r) || typeof r[0] !== "string") continue;
      const by = +r[4];
      if (by === R.me || !R.teams.has(by) || R.teams.get(by) !== R.team) continue;
      pingIn(P, by, r[0].slice(0, 32), r[1], r[2], r[3]);
    }
    Rd().pings = P;
  }
  C.ctl = function() {
    teamSend({
      k: "ctl"
    });
  };
  function onCtl(from) {
    if (sameTeam(from) && Rd().ctrlOn) Rd().ctrlOn(false, true);
  }
  C.flare = function(p) {
    if (p) teamSend({
      k: "flr",
      f: p.floor,
      x: r2(p.x),
      y: r2(p.y)
    });
  };
  C.flareDone = function(p) {
    if (p) teamSend({
      k: "flare",
      f: p.floor,
      x: r2(p.x),
      y: r2(p.y)
    });
  };
  function onFlr(from, d, done) {
    if (!sameTeam(from) || !Rd().mateFlareIn) return;
    Rd().mateFlareIn(C.raid.names.get(from) || "#" + from, d.f | 0, +d.x, +d.y, done);
  }
  C.storyTook = function(n, id) {
    const R = R_();
    if (!R) return;
    const G0 = Rd().storyGone;
    if (G0 && G0[n] == null) G0[n] = R.me;
    msend({
      k: "stk",
      s: R.seed,
      n,
      id
    });
  };
  function onStk(from, d) {
    const R = C.raid, n = typeof d.n === "string" ? d.n.slice(0, 60) : "";
    if (!n) return;
    const G0 = Rd().storyGone || (Rd().storyGone = Object.create(null)), first = G0[n];
    if (first == null) G0[n] = from; else if (first !== from && R.auth === R.me) {
      msend({
        k: "stno",
        s: R.seed,
        n,
        id: d.id
      }, from);
      return;
    }
    if (Rd().storyLost && Rd().storyLost(n)) SX.log("★ 「" + n + "」 — 다른 사람이 먼저 주웠습니다", "warn");
  }
  function onStno(from, d) {
    const R = C.raid;
    if (from !== R.auth || typeof d.n !== "string") return;
    const st = SX.game.stats;
    if (st && st.picked) {
      const k = st.picked.indexOf(d.n);
      if (k >= 0) st.picked.splice(k, 1);
    }
    onDeny({
      id: d.id
    });
  }
  function onData(from, d) {
    const R = C.raid;
    if (!R || R.offline || d.s !== R.seed) return;
    switch (d.k) {
     case "hi":
      return onHi(from, d);

     case "st":
      return onSt(from, d);

     case "es":
      if (R.auth !== R.me && from === R.auth) onEnemySnap(d);
      return;

     case "hit":
      return onHit(from, d);

     case "hfx":
      if (R.auth !== R.me && from === R.auth) onHfx(d);
      return;

     case "pg":
      if (R.auth !== R.me && from === R.auth) msend({
        k: "po",
        s: R.seed,
        at: d.at
      }, from);
      return;

     case "po":
      if (R.auth === R.me) {
        const v = (performance.now() - (+d.at || 0)) / 1e3;
        if (v >= 0 && v < 5) (R.rtt || (R.rtt = new Map)).set(from, v);
      }
      return;

     case "kill":
      return onKill(d);

     case "hurt":
      return onHurt(d);

     case "hurtAl":
      return onHurtAlly(d);

     case "shot":
      return onShot(from, d);

     case "eshot":
      return onEShot(d);

     case "nade":
      return onNade(from, d);

     case "brick":
      return onBrick(from, d);

     case "efx":
      return onEfx(from, d);

     case "nz":
      return onNoise(d);

     case "knock":
      return onKnock(d);

     case "door":
      return onDoor(d);

     case "stair":
      return onStair(d);

     case "trap":
      return onTrap(d);

     case "tplace":
      return onTrapPlace(from, d);

     case "heli":
      return Rd().callHeli(true, d.t);

     case "take":
      return onTake(from, d);

     case "put":
      return onPut(from, d);

     case "cg":
      return onCg(d);

     case "deny":
      return onDeny(d);

     case "tok":
      return onTok(d);

     case "mod":
      return onMod(from, d);

     case "modno":
      return onModNo(d);

     case "nc":
      return onNewCont(d);

     case "dead":
      return onDead(from, d);

     case "rv":
      return onRv(from, d);

     case "revive":
      return onRevive(from);

     case "auth":
      return onAuth(d);

     case "sync":
      return onSync(from);

     case "world":
      return onWorld(d);

     case "ev":
      return SX.ev && SX.ev.onMsg(from, d);

     case "bd":
      return SX.bdev && SX.bdev.onMsg(from, d);

     case "ch":
      return SX.chem && SX.chem.onMsg(from, d);

     case "wk":
      return SX.week && SX.week.onMsg(from, d);

     case "mi":
      return SX.mis && SX.mis.onMsg(from, d);

     case "png":
      return onPng(from, d);

     case "pings":
      return onPings(from, d);

     case "ctl":
      return onCtl(from);

     case "flr":
      return onFlr(from, d, false);

     case "flare":
      return onFlr(from, d, true);

     case "stk":
      return onStk(from, d);

     case "stno":
      return onStno(from, d);

     case "chat":
      if (R.teams.get(from) === R.team) chatIn(R.names.get(from), d);
      return;
    }
  }
  C.evSend = (d, to) => {
    const R = R_();
    if (!R) return;
    d.k = "ev";
    d.s = R.seed;
    msend(d, to);
  };
  C.bdSend = (d, to) => {
    const R = R_();
    if (!R) return;
    d.k = "bd";
    d.s = R.seed;
    msend(d, to);
  };
  C.chSend = (d, to) => {
    const R = R_();
    if (!R) return;
    d.k = "ch";
    d.s = R.seed;
    msend(d, to);
  };
  C.evTeam = d => {
    d.k = "ev";
    teamSend(d);
  };
  C.evSame = from => sameTeam(from);
  C.wkSend = (d, to) => {
    const R = R_();
    if (!R) return;
    d.k = "wk";
    d.s = R.seed;
    msend(d, to);
  };
  C.miSend = (d, to) => {
    const R = R_();
    if (!R) return;
    d.k = "mi";
    d.s = R.seed;
    msend(d, to);
  };
  C.miTeam = d => {
    d.k = "mi";
    teamSend(d);
  };
  void {
    flush: () => flush(),
    sendEnemies: f => sendEnemies(f)
  };
})(window.SX);
