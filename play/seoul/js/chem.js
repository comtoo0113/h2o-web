(function() {
  "use strict";
  const TUNE = SX.chemTune = {
    spreadK: 1,
    floorBurns: false,
    oilR: 1.5,
    oilFuel: 4,
    bodyDmgP: 12,
    bodyDmgE: 12,
    splashR: 2,
    splashUses: 3,
    shockDmg: 25,
    shockStun: 1.5,
    shockFloodOnly: false,
    rainRoof: true,
    fireModeFuel: 900,
    blastR: 1,
    blastMin: .25,
    shockPower: 12,
    shockMax: 128,
    cap: 400,
    genMax: 24,
    dt: .2,
    sumEvery: 5,
    shockGate: 2.5,
    shockEvery: 1,
    panelP: .6,
    panelWetR: 3.2,
    panelNear: 7
  };
  var ELEMENTS = [ {
    id: "fire",
    ko: "불"
  }, {
    id: "water",
    ko: "물"
  }, {
    id: "elec",
    ko: "전기"
  } ];
  var MATERIALS = [ {
    id: "wood",
    ko: "나무(나무 가구 · 나무 문 · 나무 벽)",
    fuel: 40,
    burnt: "ash"
  }, {
    id: "cloth",
    ko: "천(소파 · 이불 · 커튼 · 깔개)",
    fuel: 10,
    burnt: "ash"
  }, {
    id: "oil",
    ko: "기름(화염병)",
    fuel: TUNE.oilFuel,
    burnt: "ash"
  }, {
    id: "metal",
    ko: "쇠"
  }, {
    id: "stone",
    ko: "돌(콘크리트 · 회벽 · 유리 · 바닥)"
  }, {
    id: "waterbody",
    ko: "물(물 차오름)",
    emits: [ "water" ]
  }, {
    id: "flesh",
    ko: "몸(사람 · 적 · 좀비)",
    fuel: 4,
    burnt: "flesh"
  }, {
    id: "ash",
    ko: "재(다 탄 칸)"
  } ];
  function defaultTable() {
    var T = {};
    function put(a, b, d) {
      T[a + "|" + b] = d;
    }
    var NONE = {
      do: "none"
    };
    put("fire", "grass", {
      do: "ignite",
      rate: .3,
      makes: [ "fire", "smoke" ]
    });
    put("fire", "wood", {
      do: "ignite",
      rate: .06,
      makes: [ "fire", "smoke" ]
    });
    put("fire", "thatch", {
      do: "ignite",
      rate: .45,
      makes: [ "fire", "smoke" ]
    });
    put("fire", "cloth", {
      do: "ignite",
      rate: .25,
      makes: [ "fire", "smoke" ]
    });
    put("fire", "oil", {
      do: "ignite",
      rate: 2,
      makes: [ "fire", "smoke" ]
    });
    put("fire", "metal", {
      do: "heat"
    });
    put("fire", "stone", NONE);
    put("fire", "soil", NONE);
    put("fire", "waterbody", {
      do: "steam",
      makes: [ "smoke" ]
    });
    put("fire", "iceblock", {
      do: "melt",
      rate: .25,
      to: "waterbody",
      makes: [ "water" ]
    });
    put("fire", "flesh", {
      do: "ignite",
      rate: 1,
      makes: [ "fire" ]
    });
    put("fire", "ash", NONE);
    [ "grass", "wood", "thatch", "cloth", "metal", "stone", "soil", "flesh", "ash" ].forEach(function(m) {
      put("water", m, {
        do: "wet",
        makes: [ "@wet" ]
      });
    });
    put("water", "oil", NONE);
    put("water", "waterbody", NONE);
    put("water", "iceblock", NONE);
    put("ice", "waterbody", {
      do: "freeze",
      to: "iceblock"
    });
    put("ice", "flesh", {
      do: "freeze",
      makes: [ "@frozen" ]
    });
    [ "grass", "wood", "thatch", "cloth", "oil", "metal", "stone", "soil", "iceblock", "ash" ].forEach(function(m) {
      put("ice", m, NONE);
    });
    put("elec", "metal", {
      do: "conduct",
      makes: [ "elec" ]
    });
    put("elec", "waterbody", {
      do: "conduct",
      makes: [ "elec" ]
    });
    put("elec", "flesh", {
      do: "shock",
      makes: [ "@charged" ]
    });
    put("elec", "oil", {
      do: "ignite",
      rate: 2,
      makes: [ "fire" ]
    });
    [ "grass", "wood", "thatch", "cloth", "stone", "soil", "iceblock", "ash" ].forEach(function(m) {
      put("elec", m, NONE);
    });
    put("wind", "cloth", {
      do: "push"
    });
    put("wind", "flesh", {
      do: "push"
    });
    [ "grass", "wood", "thatch", "oil", "metal", "stone", "soil", "waterbody", "iceblock", "ash" ].forEach(function(m) {
      put("wind", m, NONE);
    });
    put("fire", "fire", NONE);
    put("fire", "water", {
      do: "extinguish",
      makes: [ "smoke" ]
    });
    put("fire", "ice", {
      do: "cancel",
      makes: [ "water" ]
    });
    put("fire", "elec", NONE);
    put("fire", "wind", {
      do: "push",
      k: .4
    });
    put("water", "water", NONE);
    put("water", "ice", {
      do: "freeze"
    });
    put("water", "elec", {
      do: "conduct",
      makes: [ "elec" ]
    });
    put("water", "wind", NONE);
    put("ice", "ice", NONE);
    put("ice", "elec", NONE);
    put("ice", "wind", NONE);
    put("elec", "elec", NONE);
    put("elec", "wind", NONE);
    put("wind", "wind", NONE);
    put("elec", "@wet", {
      do: "conduct",
      makes: [ "elec" ]
    });
    put("fire", "@wet", {
      do: "none",
      note: "젖음 0.8 넘으면 불이 안 붙음 · 붙는 빠르기 ×(1-젖음)²"
    });
    put("ice", "@wet", {
      do: "freeze",
      makes: [ "@frozen" ]
    });
    put("fire", "@frozen", {
      do: "cancel"
    });
    return T;
  }
  function elemIndex(elements, id) {
    for (var i = 0; i < elements.length; i++) {
      if (elements[i].id === id) {
        return i;
      }
    }
    return -1;
  }
  function key(a, b, elements) {
    elements = elements || ELEMENTS;
    var ia = elemIndex(elements, a), ib = elemIndex(elements, b);
    if (ia >= 0 && ib >= 0 && ib < ia) {
      return b + "|" + a;
    }
    return a + "|" + b;
  }
  function rule(table, a, b, elements) {
    return table[key(a, b, elements)];
  }
  function cloneTable(T) {
    var o = {};
    for (var k in T) {
      if (Object.prototype.hasOwnProperty.call(T, k)) {
        o[k] = Object.assign({}, T[k]);
      }
    }
    return o;
  }
  function mix(h) {
    h = Math.imul(h ^ h >>> 16, 2246822507);
    h = Math.imul(h ^ h >>> 13, 3266489909);
    return (h ^ h >>> 16) >>> 0;
  }
  function rnd(seed, i, tick, salt) {
    var h = mix(seed >>> 0 ^ Math.imul(i + 1, 2654435761));
    h = mix(h ^ Math.imul(tick + 1, 2246822519));
    h = mix(h ^ (salt | 0) + 668265263);
    return h / 4294967296;
  }
  function rateToP(lambda, dt) {
    return lambda > 0 ? 1 - Math.exp(-lambda * dt) : 0;
  }
  var NB = [ [ -1, -1 ], [ 0, -1 ], [ 1, -1 ], [ -1, 0 ], [ 1, 0 ], [ -1, 1 ], [ 0, 1 ], [ 1, 1 ] ];
  function compileMaterials(materials, table, elements) {
    var idx = {}, n = materials.length;
    var F = new Float32Array(n), FUEL = new Float32Array(n), BURNT = new Int16Array(n), MELT_TO = new Int16Array(n), MELT_R = new Float32Array(n), COND = new Uint8Array(n);
    materials.forEach(function(m, i) {
      idx[m.id] = i;
    });
    materials.forEach(function(m, i) {
      var r = table[key("fire", m.id, elements)];
      F[i] = r && r.do === "ignite" ? r.rate || 0 : 0;
      FUEL[i] = m.fuel || 0;
      BURNT[i] = m.burnt && idx[m.burnt] !== undefined ? idx[m.burnt] : i;
      MELT_TO[i] = -1;
      if (r && r.do === "melt" && idx[r.to] !== undefined) {
        MELT_TO[i] = idx[r.to];
        MELT_R[i] = r.rate || 0;
      }
      var e = table[key("elec", m.id, elements)];
      COND[i] = e && e.do === "conduct" ? 1 : 0;
    });
    return {
      idx,
      F,
      FUEL,
      BURNT,
      MELT_TO,
      MELT_R,
      COND,
      list: materials
    };
  }
  function makeWorld(w, h, opts) {
    opts = opts || {};
    var table = opts.table || defaultTable();
    var materials = opts.materials || MATERIALS;
    var elements = opts.elements || ELEMENTS;
    var C = compileMaterials(materials, table, elements);
    var N = w * h;
    var W = {
      w,
      h,
      N,
      ox: opts.ox || 0,
      oy: opts.oy || 0,
      cell: opts.cell || 1,
      seed: (opts.seed === undefined ? 1 : opts.seed) >>> 0,
      table,
      elements,
      C,
      mat: new Uint8Array(N),
      burn: new Uint8Array(N),
      fuel: new Float32Array(N),
      gen: new Float32Array(N),
      wet: new Float32Array(N),
      wetT: new Float32Array(N),
      seen: new Uint32Array(N),
      burning: [],
      changed: [],
      events: [],
      t: 0,
      tick: 0,
      groundWet: 0,
      burntCount: 0
    };
    var fill = C.idx[opts.fill || "grass"];
    for (var i = 0; i < N; i++) {
      var m = fill;
      if (opts.matAt) {
        var id = opts.matAt(W.ox + i % w, W.oy + (i / w | 0));
        if (C.idx[id] !== undefined) {
          m = C.idx[id];
        }
      }
      W.mat[i] = m;
      W.fuel[i] = C.FUEL[m];
    }
    return W;
  }
  function setMat(W, x, y, id) {
    var i = y * W.w + x, m = W.C.idx[id];
    if (m === undefined || x < 0 || y < 0 || x >= W.w || y >= W.h) {
      return false;
    }
    W.mat[i] = m;
    W.fuel[i] = W.C.FUEL[m];
    return true;
  }
  function fillRect(W, x0, y0, x1, y1, id) {
    for (var y = Math.max(0, y0); y <= Math.min(W.h - 1, y1); y++) {
      for (var x = Math.max(0, x0); x <= Math.min(W.w - 1, x1); x++) {
        setMat(W, x, y, id);
      }
    }
  }
  var WET_TAU = 60;
  function wetAt(W, i) {
    if (W.rw && W.rw[i]) return 1;
    var own = W.wet[i] > 0 ? W.wet[i] * Math.exp(-(W.t - W.wetT[i]) / WET_TAU) : 0;
    return own > W.groundWet ? own : W.groundWet;
  }
  var ENV_DEFAULT = {
    wind: {
      x: 0,
      y: 0
    },
    windK: .4,
    rain: 0,
    rainExt: .35,
    wetExt: 1,
    wetRise: 40,
    wetDry: 300,
    noIgniteWet: .8,
    rainSpread: .6,
    spreadK: 1,
    cap: Infinity,
    genMax: Infinity
  };
  function envOf(e) {
    var o = {};
    for (var k in ENV_DEFAULT) {
      o[k] = ENV_DEFAULT[k];
    }
    if (e) {
      for (var k2 in e) {
        o[k2] = e[k2];
      }
    }
    return o;
  }
  function mark(W, i) {
    W.changed.push(i);
  }
  function igniteCell(W, i, gen) {
    var m = W.mat[i];
    if (W.burn[i] || W.C.F[m] <= 0 || W.fuel[i] <= 0) {
      return false;
    }
    W.burn[i] = 1;
    W.gen[i] = gen;
    W.burning.push(i);
    mark(W, i);
    return true;
  }
  function igniteAt(W, x, y, opts) {
    opts = opts || {};
    if (x < 0 || y < 0 || x >= W.w || y >= W.h) {
      return false;
    }
    var i = y * W.w + x;
    if (wetAt(W, i) >= (opts.noIgniteWet === undefined ? ENV_DEFAULT.noIgniteWet : opts.noIgniteWet)) {
      return false;
    }
    return igniteCell(W, i, opts.gen || 0);
  }
  function igniteArea(W, cx, cy, r, opts) {
    var n = 0;
    for (var y = cy - r; y <= cy + r; y++) {
      for (var x = cx - r; x <= cx + r; x++) {
        if ((x - cx) * (x - cx) + (y - cy) * (y - cy) <= r * r && igniteAt(W, x, y, opts)) {
          n++;
        }
      }
    }
    return n;
  }
  function splash(W, cx, cy, r) {
    var put = 0, out = 0;
    for (var y = Math.max(0, cy - r); y <= Math.min(W.h - 1, cy + r); y++) {
      for (var x = Math.max(0, cx - r); x <= Math.min(W.w - 1, cx + r); x++) {
        if ((x - cx) * (x - cx) + (y - cy) * (y - cy) > r * r) {
          continue;
        }
        var i = y * W.w + x;
        W.wet[i] = 1;
        W.wetT[i] = W.t;
        put++;
        if (W.burn[i]) {
          W.burn[i] = 0;
          out++;
          mark(W, i);
          W.events.push({
            type: "steam",
            i
          });
        }
      }
    }
    if (out) {
      W.burning = W.burning.filter(function(j) {
        return W.burn[j] === 1;
      });
    }
    return {
      wetted: put,
      extinguished: out
    };
  }
  function shock(W, cx, cy, power, opts) {
    opts = opts || {};
    var maxCells = opts.maxCells || 128, wetMin = opts.wetMin === undefined ? .5 : opts.wetMin;
    var wetRule = W.table["elec|@wet"], wetConducts = !!(wetRule && wetRule.do === "conduct");
    var oilR = rule(W.table, "elec", "oil", W.elements), oilIdx = W.C.idx.oil;
    function conducts(i) {
      return W.C.COND[W.mat[i]] === 1 || wetConducts && wetAt(W, i) >= wetMin;
    }
    var start = cy * W.w + cx, cells = [], strength = [], seen = {}, q = [ [ start, power ] ], capped = false, sparks = 0;
    seen[start] = 1;
    while (q.length) {
      var it = q.shift(), i = it[0], s = it[1];
      cells.push(i);
      strength.push(s);
      if (oilR && oilR.do === "ignite" && W.mat[i] === oilIdx && igniteCell(W, i, 0)) {
        sparks++;
      }
      if (cells.length >= maxCells) {
        capped = q.length > 0;
        break;
      }
      if (s <= 1 || !conducts(i)) {
        continue;
      }
      var x = i % W.w, y = i / W.w | 0;
      var nb = [ [ x + 1, y ], [ x - 1, y ], [ x, y + 1 ], [ x, y - 1 ] ];
      for (var k = 0; k < 4; k++) {
        var nx = nb[k][0], ny = nb[k][1];
        if (nx < 0 || ny < 0 || nx >= W.w || ny >= W.h) {
          continue;
        }
        var j = ny * W.w + nx;
        if (seen[j]) {
          continue;
        }
        if (!conducts(j)) {
          if (oilR && oilR.do === "ignite" && W.mat[j] === oilIdx && igniteCell(W, j, 0)) {
            sparks++;
            seen[j] = 1;
          }
          continue;
        }
        seen[j] = 1;
        q.push([ j, s - 1 ]);
      }
    }
    return {
      cells,
      strength,
      capped,
      sparks
    };
  }
  function step(W, dt, env) {
    env = envOf(env);
    var C = W.C, w = W.w, h = W.h, R = env.rain;
    W.changed = [];
    if (R > 0) {
      W.groundWet += (R - W.groundWet) * (1 - Math.exp(-dt / env.wetRise));
    } else {
      W.groundWet *= Math.exp(-dt / env.wetDry);
    }
    var start = W.burning, count = start.length;
    var throttle = 1;
    if (isFinite(env.cap)) {
      throttle = count >= env.cap ? 0 : 1 - Math.pow(count / env.cap, 4);
    }
    var wx = env.wind.x || 0, wy = env.wind.y || 0;
    var burnt = [], out = [], ign = [], ignGen = [], melts = [];
    var ops = 0, i, k;
    for (var a = 0; a < start.length; a++) {
      i = start[a];
      ops++;
      W.fuel[i] -= dt;
      if (W.fuel[i] <= 0) {
        burnt.push(i);
        continue;
      }
      var we = wetAt(W, i);
      var lamOut = env.rainExt * R + env.wetExt * Math.max(0, we - .3);
      if (lamOut > 0 && rnd(W.seed, i, W.tick, 1) < rateToP(lamOut, dt)) {
        out.push(i);
      }
    }
    var stamp = W.tick + 1, cand = [];
    for (a = 0; a < start.length; a++) {
      i = start[a];
      var x0 = i % w, y0 = i / w | 0;
      for (k = 0; k < 8; k++) {
        var nx = x0 + NB[k][0], ny = y0 + NB[k][1];
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) {
          continue;
        }
        var n = ny * w + nx;
        ops++;
        if (W.seen[n] === stamp) {
          continue;
        }
        W.seen[n] = stamp;
        if (!W.burn[n]) {
          cand.push(n);
        }
      }
    }
    for (a = 0; a < cand.length; a++) {
      var c = cand[a], m = W.mat[c], flam = C.F[m], meltTo = C.MELT_TO[m];
      if (flam <= 0 && meltTo < 0) {
        continue;
      }
      var cx = c % w, cy = c / w | 0, lam = 0, ng = 1e9;
      for (k = 0; k < 8; k++) {
        var px = cx + NB[k][0], py = cy + NB[k][1];
        if (px < 0 || py < 0 || px >= w || py >= h) {
          continue;
        }
        var p = py * w + px;
        ops++;
        if (!W.burn[p]) {
          continue;
        }
        var dx = -NB[k][0], dy = -NB[k][1], diag = dx !== 0 && dy !== 0;
        var len = diag ? 1.41421356 : 1;
        var dirF = 1 + env.windK * (dx * wx + dy * wy) / len;
        if (dirF < .15) {
          dirF = .15;
        } else if (dirF > 4) {
          dirF = 4;
        }
        lam += (diag ? .70710678 : 1) * dirF;
        var gc = W.gen[p] + 1 / Math.sqrt(dirF);
        if (gc < ng) {
          ng = gc;
        }
      }
      if (lam <= 0) {
        continue;
      }
      if (meltTo >= 0) {
        if (rnd(W.seed, c, W.tick, 2) < rateToP(C.MELT_R[m] * lam, dt)) {
          melts.push(c);
        }
        continue;
      }
      var wc = wetAt(W, c);
      if (wc >= env.noIgniteWet || W.fuel[c] <= 0) {
        continue;
      }
      var genF = 1;
      if (isFinite(env.genMax)) {
        genF = ng >= env.genMax ? 0 : 1 - ng / env.genMax * (ng / env.genMax);
      }
      lam *= flam * env.spreadK * (1 - wc) * (1 - wc) * (1 - env.rainSpread * R) * throttle * genF;
      if (lam > 0 && rnd(W.seed, c, W.tick, 0) < rateToP(lam, dt)) {
        ign.push(c);
        ignGen.push(ng);
      }
    }
    for (a = 0; a < burnt.length; a++) {
      i = burnt[a];
      W.burn[i] = 0;
      W.mat[i] = C.BURNT[W.mat[i]];
      W.fuel[i] = 0;
      W.burntCount++;
      mark(W, i);
    }
    for (a = 0; a < out.length; a++) {
      i = out[a];
      W.burn[i] = 0;
      mark(W, i);
    }
    for (a = 0; a < melts.length; a++) {
      i = melts[a];
      W.mat[i] = C.MELT_TO[W.mat[i]];
      W.fuel[i] = C.FUEL[W.mat[i]];
      mark(W, i);
      W.events.push({
        type: "melt",
        i
      });
    }
    var next = [];
    for (a = 0; a < start.length; a++) {
      if (W.burn[start[a]]) {
        next.push(start[a]);
      }
    }
    for (a = 0; a < ign.length; a++) {
      i = ign[a];
      if (!W.burn[i]) {
        W.burn[i] = 1;
        W.gen[i] = ignGen[a];
        next.push(i);
        mark(W, i);
      }
    }
    W.burning = next;
    W.t += dt;
    W.tick++;
    return {
      burning: next.length,
      ignited: ign.length,
      out: out.length,
      burnt: burnt.length,
      melted: melts.length,
      ops,
      changed: W.changed.length
    };
  }
  function entityTick(W, ent, dt, env) {
    env = envOf(env);
    var ev = [];
    var xi = Math.floor(ent.x), yi = Math.floor(ent.y);
    if (xi < 0 || yi < 0 || xi >= W.w || yi >= W.h) {
      return ev;
    }
    var i = yi * W.w + xi, C = W.C, fl = rule(W.table, "fire", ent.mat || "flesh", W.elements);
    var flam = fl && fl.do === "ignite" ? fl.rate : 0;
    var salt = (mix((ent.id | 0) + 77) & 65535) + 10;
    var cellWet = wetAt(W, i);
    ent.wet = Math.max(ent.wet || 0, W.groundWet, W.mat[i] === C.idx.waterbody ? 1 : 0);
    if (ent.burning > 0 && (ent.wet >= env.noIgniteWet || cellWet >= env.noIgniteWet)) {
      ent.burning = 0;
      ev.push({
        type: "entity_out",
        id: ent.id
      });
    }
    if (!(ent.burning > 0) && W.burn[i] && flam > 0 && ent.wet < env.noIgniteWet) {
      if (rnd(W.seed, i, W.tick, salt) < rateToP(flam * (1 - ent.wet) * (1 - ent.wet), dt)) {
        ent.burning = C.FUEL[C.idx[ent.mat || "flesh"]] || 4;
        ent.fireGen = W.gen[i];
        ev.push({
          type: "entity_ignite",
          id: ent.id
        });
      }
    }
    if (ent.burning > 0) {
      ent.burning -= dt;
      if (!W.burn[i] && C.F[W.mat[i]] > 0 && cellWet < env.noIgniteWet) {
        if (rnd(W.seed, i, W.tick, salt + 1) < rateToP(C.F[W.mat[i]] * 2, dt)) {
          var g = (ent.fireGen || 0) + 1;
          if (!isFinite(env.genMax) || g < env.genMax) {
            if (igniteCell(W, i, g)) {
              ev.push({
                type: "cell_ignite_by_entity",
                id: ent.id,
                i
              });
            }
          }
        }
      }
      if (ent.burning <= 0) {
        ent.burning = 0;
        ev.push({
          type: "entity_out",
          id: ent.id
        });
      }
    }
    return ev;
  }
  function makeGate(icdSec) {
    var last = {};
    return {
      allow: function(targetId, reaction, now) {
        var k = targetId + "|" + reaction, t = last[k];
        if (t !== undefined && now - t < icdSec) {
          return false;
        }
        last[k] = now;
        return true;
      }
    };
  }
  function encodeChanges(W) {
    var seen = {}, list = [];
    for (var a = 0; a < W.changed.length; a++) {
      var i = W.changed[a];
      if (!seen[i]) {
        seen[i] = 1;
        list.push(i);
      }
    }
    var buf = new Uint8Array(list.length * 4);
    for (var b = 0; b < list.length; b++) {
      var j = list[b], o = b * 4;
      buf[o] = j & 255;
      buf[o + 1] = j >>> 8 & 255;
      buf[o + 2] = j >>> 16 & 255;
      buf[o + 3] = W.mat[j] & 127 | (W.burn[j] ? 128 : 0);
    }
    return buf;
  }
  function applyChanges(W, buf) {
    var touched = 0;
    for (var o = 0; o + 3 < buf.length; o += 4) {
      var j = buf[o] | buf[o + 1] << 8 | buf[o + 2] << 16;
      if (j >= W.N) {
        continue;
      }
      W.mat[j] = buf[o + 3] & 127;
      W.burn[j] = buf[o + 3] & 128 ? 1 : 0;
      touched++;
    }
    return touched;
  }
  function checksum(W) {
    var h = 2166136261 >>> 0;
    for (var i = 0; i < W.N; i++) {
      h = Math.imul(h ^ (W.mat[i] | W.burn[i] << 7), 16777619) >>> 0;
    }
    return h;
  }
  function gameTable() {
    const T0 = defaultTable(), T = {}, E = {}, Mi = {};
    ELEMENTS.forEach(e => {
      E[e.id] = 1;
    });
    MATERIALS.forEach(m => {
      Mi[m.id] = 1;
    });
    for (const k in T0) {
      const p = k.split("|");
      if (!E[p[0]]) continue;
      if (!(E[p[1]] || Mi[p[1]] || p[1] === "@wet")) continue;
      T[k] = T0[k];
    }
    return T;
  }
  const TABLE = gameTable();
  const CM = compileMaterials(MATERIALS, TABLE, ELEMENTS);
  const MI = CM.idx, WOOD = MI.wood, CLOTH = MI.cloth, OIL = MI.oil, METAL = MI.metal, STONE = MI.stone, ASH = MI.ash;
  const CH = SX.chem = {
    on: true,
    near: 0,
    TUNE,
    TABLE,
    ELEMENTS,
    MATERIALS,
    stats: {
      ms: 0,
      peakMs: 0,
      ticks: 0,
      bytes: 0,
      msgs: 0,
      peakBurn: 0
    },
    testGens: [],
    kit: {
      makeWorld,
      step,
      splash,
      shock,
      entityTick,
      encodeChanges,
      applyChanges,
      checksum,
      igniteAt,
      igniteCell,
      igniteArea,
      setMat,
      wetAt,
      rnd,
      envOf
    }
  };
  const WORLDS = new Map;
  let lvRef = null, acc = 0, sumT = 0, shockT = 0, scanT = 0, smokeT = 0, dmgT = 0, rqT = -1e9, gate = makeGate(TUNE.shockGate);
  const boSent = new Map;
  let myPrev = {
    burn: false,
    sh: false
  };
  const Rd = () => SX.raid, A = () => SX.actors;
  const live = () => {
    const R = SX.raid;
    return !!(R && R.on && R.level && R.level === lvRef);
  };
  const R_ = () => {
    const C = SX.coop, R = C && C.raid;
    return R && !R.offline ? R : null;
  };
  const auth = () => !SX.coop || SX.coop.runEnemies();
  const me = () => {
    const R = R_();
    return R ? R.me : 0;
  };
  const TS = () => SX.TS || 32;
  function idNum(s) {
    let h = 7;
    s = String(s);
    for (let k = 0; k < s.length; k++) h = Math.imul(h, 31) + s.charCodeAt(k) | 0;
    return 1e3 + (h & 65535);
  }
  const TILE_MAT = {
    conc: "stone",
    plaster: "stone",
    glass: "stone",
    wood: "wood",
    door: "wood",
    metal: "metal"
  };
  const PROP_MAT = {
    fabric: "cloth",
    wood: "wood",
    metal: "metal"
  };
  CH.matName = function(F, x, y) {
    const T = SX.map.T, i = y * F.W + x, t = F.t[i];
    if (t === T.WALL || t === T.WINDOW || t === T.DOOR) {
      const n = SX.sndProp && SX.sndProp.matName ? SX.sndProp.matName(F, x, y) : "conc";
      return TILE_MAT[n] || "stone";
    }
    if (TUNE.floorBurns && t === T.FLOOR) return "wood";
    return "stone";
  };
  CH.propMat = kind => {
    const SP = SX.sndPlace;
    return PROP_MAT[SP && SP.matOf ? SP.matOf(kind) : "stone"] || "stone";
  };
  function baseMats(F) {
    const N = F.W * F.H, b = new Uint8Array(N);
    for (let i = 0; i < N; i++) b[i] = MI[CH.matName(F, i % F.W, i / F.W | 0)];
    const T = SX.map.T;
    for (const p of F.props || []) {
      if (p.kind === "blaze" || p.kind === "fire") continue;
      const m = MI[CH.propMat(p.kind)];
      if (m === STONE) continue;
      const x0 = Math.floor(p.x), y0 = Math.floor(p.y), x1 = Math.ceil(p.x + (p.w || 1)) - 1, y1 = Math.ceil(p.y + (p.h || 1)) - 1;
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        if (!F.in(x, y)) continue;
        const i = y * F.W + x, t = F.t[i];
        if (t === T.WALL || t === T.VOID || t === T.WINDOW) continue;
        b[i] = m;
      }
    }
    return b;
  }
  const vk = F => (F.props ? F.props.length : 0) + ":" + (F.ver || 0);
  function blazeAt(F, x, y) {
    for (const p of F.props) if (p.kind === "blaze" && Math.floor(p.x) === x && Math.floor(p.y) === y) return p;
    return null;
  }
  function world(f) {
    let W = WORLDS.get(f);
    if (W) return W;
    const R = Rd(), lv = R && R.level, F = lv && lv.floors[f];
    if (!F || !CH.on) return null;
    if (lv !== lvRef) reset(lv);
    W = makeWorld(F.W, F.H, {
      seed: (lv.seed | 0) * 31 + f * 977 + 13 >>> 0 || 1,
      table: TABLE,
      materials: MATERIALS,
      elements: ELEMENTS,
      fill: "stone"
    });
    const b = baseMats(F), N = W.N;
    for (let i = 0; i < N; i++) {
      W.mat[i] = b[i];
      W.fuel[i] = W.C.FUEL[b[i]];
    }
    W.f = f;
    W.F = F;
    W.mirror = new Uint8Array(N);
    W.own = new Uint8Array(N);
    W.eternal = [];
    W.eternalSet = new Set;
    W.oil = new Set;
    W.wetSet = new Set;
    W.lstash = [];
    W.fx = null;
    W.fxT = 0;
    W.verSeen = "";
    W.dmg = 0;
    if (F.ePanel) {
      W.rw = new Uint8Array(N);
      for (const i of F.ePanel.wet) W.rw[i] = 1;
    }
    if (F.fireAt) for (let i = 0; i < N; i++) if (F.fireAt[i]) {
      W.mat[i] = WOOD;
      W.fuel[i] = R.fire ? TUNE.fireModeFuel : Infinity;
      W.burn[i] = 1;
      W.burning.push(i);
      W.mirror[i] = 1;
    }
    for (const p of F.props || []) if (p.kind === "fire") {
      const x = Math.floor(p.x), y = Math.floor(p.y);
      if (!F.in(x, y)) continue;
      const i = y * F.W + x;
      W.mat[i] = WOOD;
      W.fuel[i] = Infinity;
      if (!W.burn[i]) {
        W.burn[i] = 1;
        W.burning.push(i);
      }
      W.eternal.push(i);
      W.eternalSet.add(i);
    }
    W.base0 = Uint8Array.from(W.mat);
    W.burn0 = Uint8Array.from(W.burn);
    W.fuel0 = Float32Array.from(W.fuel);
    W.verSeen = vk(F);
    WORLDS.set(f, W);
    {
      const CR = R_();
      if (CR && CR.auth != null && !auth()) send({
        rq: f
      }, CR.auth);
    }
    return W;
  }
  CH.world = f => world(f);
  CH.worlds = WORLDS;
  CH.embers = function(F) {
    const W = F ? WORLDS.get(F.idx) : null;
    let setup = 0, eternal = 0;
    if (F && F.fireAt) for (let i = 0; i < F.fireAt.length; i++) if (F.fireAt[i]) setup++;
    for (const p of F && F.props || []) if (p.kind === "fire") eternal++;
    return {
      setup,
      eternal,
      fuel: Rd() && Rd().fire ? TUNE.fireModeFuel : Infinity,
      burning: W ? W.burning.length : 0
    };
  };
  function reburn(W) {
    for (const i of W.eternal) if (!W.burn[i]) {
      W.burn[i] = 1;
      W.fuel[i] = Infinity;
      W.burning.push(i);
    }
  }
  function reset(lv) {
    WORLDS.clear();
    vkFloor.clear();
    newT = 0;
    lvRef = lv;
    acc = 0;
    sumT = 0;
    shockT = 0;
    scanT = 0;
    boSent.clear();
    CH.near = 0;
    CH.boot = 0;
    gate = makeGate(TUNE.shockGate);
    myPrev = {
      burn: false,
      sh: false
    };
    const a = A();
    if (a && a.player) a.player.chem = null;
  }
  CH.reset = () => reset(Rd() && Rd().level);
  const FIRE_C = l => l && l.c && l.c[0] === 255 && l.c[1] === 130 && l.c[2] === 50;
  function litNear(W, x, y, r) {
    const F = W.F;
    for (let yy = y - r; yy <= y + r; yy++) for (let xx = x - r; xx <= x + r; xx++) if (F.in(xx, yy) && W.mirror[yy * F.W + xx]) return true;
    return false;
  }
  function lampOn(W, x, y) {
    const F = W.F;
    if (!F.lamps) return;
    if (F.lamps.some(l => FIRE_C(l) && Math.abs(l.x - x - .5) <= 3 && Math.abs(l.y - y - .5) <= 3)) return;
    const k = W.lstash.findIndex(l => Math.abs(l.x - x - .5) <= 3 && Math.abs(l.y - y - .5) <= 3);
    if (k >= 0) {
      F.lamps.push(W.lstash[k]);
      W.lstash.splice(k, 1);
      return;
    }
    F.lamps.push({
      x: x + .5,
      y: y + .5,
      r: 5,
      c: [ 255, 130, 50 ],
      a: .6,
      flicker: true,
      chem: 1
    });
  }
  function lampOff(W, x, y) {
    const F = W.F;
    if (!F.lamps) return;
    for (let k = F.lamps.length - 1; k >= 0; k--) {
      const l = F.lamps[k];
      if (!FIRE_C(l) || Math.abs(l.x - x - .5) > 3 || Math.abs(l.y - y - .5) > 3) continue;
      if (litNear(W, Math.floor(l.x), Math.floor(l.y), 3)) continue;
      F.lamps.splice(k, 1);
      if (!l.chem) W.lstash.push(l);
    }
  }
  function mirrorCell(W, i) {
    const F = W.F, x = i % F.W, y = i / F.W | 0;
    const on = W.burn[i] && !W.eternalSet.has(i) ? 1 : 0;
    let vis = false;
    if (W.mirror[i] !== on) {
      vis = true;
      W.mirror[i] = on;
      if (!F.fireAt) F.fireAt = new Uint8Array(F.W * F.H);
      F.fireAt[i] = on;
      if (on) {
        W.own[i] = 1;
        if (!blazeAt(F, x, y) && SX.map.addProp) {
          const bp = SX.map.addProp(F, "blaze", x, y, {
            v: x * 7 + y * 3 & 7,
            solid: false,
            tall: false,
            cover: 0
          });
          if (bp) {
            const fu = F.props.find(q => q !== bp && q.solid && !q.flat && !q.hidden && q.kind !== "blaze" && q.kind !== "fire" && q.kind !== "loot" && q.kind !== "corpse" && x >= Math.floor(q.x) && x < Math.ceil(q.x + q.w - 1e-6) && y >= Math.floor(q.y) && y < Math.ceil(q.y + q.h - 1e-6));
            if (fu) bp.onP = fu;
          }
        }
        lampOn(W, x, y);
      } else {
        const p = blazeAt(F, x, y);
        if (p && SX.map.removeProp) SX.map.removeProp(F, p);
        lampOff(W, x, y);
        if (W.mat[i] === ASH && A().decal) A().decal(F, x + .5, y + .5, "scorch", false);
      }
    }
    const oil = W.mat[i] === OIL ? 1 : 0;
    if (((F.oilAt && F.oilAt[i]) | 0) !== oil) {
      if (!F.oilAt) F.oilAt = new Uint8Array(F.W * F.H);
      F.oilAt[i] = oil;
      if (oil) W.oil.add(i); else W.oil.delete(i);
      vis = true;
    }
    return vis;
  }
  function b64(u8) {
    let s = "";
    for (let o = 0; o < u8.length; o += 4096) s += String.fromCharCode.apply(null, u8.subarray(o, o + 4096));
    return btoa(s);
  }
  function unb64(s) {
    const t = atob(String(s || "")), u = new Uint8Array(t.length);
    for (let k = 0; k < t.length; k++) u[k] = t.charCodeAt(k);
    return u;
  }
  function send(d, to) {
    const R = R_();
    if (!R || !SX.coop.chSend) return;
    try {
      SX.coop.chSend(d, to);
      CH.stats.msgs++;
    } catch (e) {}
  }
  function steamFx(W, cells) {
    const F = W.F, a = A();
    for (let k = 0; k < Math.min(6, cells.length); k++) {
      const i = cells[k];
      if (a.smoke) a.smoke(F, i % F.W + .5, (i / F.W | 0) + .3, 1, true);
    }
    const i0 = cells[0], x = i0 % F.W + .5, y = (i0 / F.W | 0) + .5;
    if (cells.length >= 4 && SX.tac && SX.tac.clouds) SX.tac.clouds.push({
      kind: "smoke",
      floor: F.idx,
      x,
      y,
      r: .6,
      r0: .6,
      R: 1.6,
      t: 4,
      life: 4,
      puffT: 0,
      hissT: 0
    });
    if (SX.audio) SX.audio.play("gasHiss", {
      x,
      y,
      f: F.idx,
      range: 18,
      vol: .6
    });
  }
  function flush(W, host) {
    const F = W.F;
    if (!W.changed.length && !W.events.length) return;
    let vis = false;
    const seen = new Set;
    for (const i of W.changed) {
      if (seen.has(i)) continue;
      seen.add(i);
      if (mirrorCell(W, i)) vis = true;
    }
    if (vis) {
      F.ver = (F.ver || 0) + 1;
      F.blazes = null;
      if (SX.art && SX.art.blazeLink) SX.art.blazeLink(F);
      W.verSeen = vk(F);
    }
    const st = [];
    for (const ev of W.events) if (ev.type === "steam") st.push(ev.i);
    if (st.length) steamFx(W, st);
    if (host && seen.size) {
      const buf = encodeChanges(W);
      CH.stats.bytes += buf.length;
      if (R_()) send({
        f: W.f,
        b: b64(buf),
        st: st.length ? st.slice(0, 8) : undefined
      });
    } else if (host && st.length && R_()) send({
      f: W.f,
      b: "",
      st: st.slice(0, 8)
    });
    W.changed = [];
    W.events = [];
  }
  function foreignScan(W) {
    const F = W.F, k = vk(F);
    if (k === W.verSeen) return;
    W.verSeen = k;
    if (!F.fireAt) return;
    for (let i = 0; i < W.N; i++) {
      if (F.fireAt[i] && !W.mirror[i] && !W.burn[i]) {
        W.mat[i] = WOOD;
        W.fuel[i] = Infinity;
        igniteCell(W, i, 0);
        W.mirror[i] = 1;
      } else if (F.fireAt[i] && !W.mirror[i]) W.mirror[i] = 1; else if (!F.fireAt[i] && W.mirror[i] && W.burn[i]) {
        W.burn[i] = 0;
        W.mirror[i] = 0;
        mark(W, i);
      }
    }
    W.burning = W.burning.filter(j => W.burn[j] === 1);
  }
  function envFor(W) {
    const G = SX.game, r = G && G.env ? +G.env.rain || 0 : 0;
    return {
      cap: TUNE.cap,
      genMax: TUNE.genMax,
      spreadK: TUNE.spreadK,
      wind: {
        x: 0,
        y: 0
      },
      rain: TUNE.rainRoof && W.F.kind === "roof" ? Math.min(1, r) : 0
    };
  }
  function floodWet(W) {
    const R = Rd();
    return !!(R && R.flood && R.wLvOf && R.wLvOf(W.f) >= 1);
  }
  function stepWorld(W, dt) {
    foreignScan(W);
    if (floodWet(W)) {
      W.groundWet = 1;
      W.flW = 1;
    } else if (W.flW) {
      W.groundWet = 0;
      W.flW = 0;
    }
    const pre = W.changed;
    step(W, dt, envFor(W));
    W.changed = pre.concat(W.changed);
    reburn(W);
    if (W.burning.length > CH.stats.peakBurn) CH.stats.peakBurn = W.burning.length;
  }
  function bodyList() {
    const a = A(), out = [], R = R_();
    const p = a.player;
    if (p && p.alive) out.push([ p, 1, "p" + (R ? R.me : 0), "P" ]);
    if (R && SX.coop.ghosts) for (const g of SX.coop.ghosts.values()) if (g.alive && !(SX.coop.stale && SX.coop.stale(g))) out.push([ g, idNum("p" + g.pid), "p" + g.pid, "G" ]);
    for (const e of a.enemies) if (e.alive) out.push([ e, 2e5 + (e.nid | 0), "e" + e.nid, "E" ]);
    return out;
  }
  function chemOf(a, id) {
    if (!a.chem) a.chem = {
      id,
      mat: "flesh",
      x: a.x,
      y: a.y,
      burning: 0,
      wet: 0,
      fireGen: 0,
      wv: 0,
      wvT: 0,
      shockT: 0,
      dmg: 0
    };
    return a.chem;
  }
  function bodies(dt) {
    const flags = [];
    for (const [a, id, key, kind] of bodyList()) {
      const W = WORLDS.get(a.floor);
      let c = a.chem;
      if (W) {
        const xi = Math.floor(a.x), yi = Math.floor(a.y), i = W.F.in(xi, yi) ? yi * W.w + xi : -1;
        if (c && c.burning > 0 || i >= 0 && W.burn[i]) {
          c = chemOf(a, id);
          c.x = a.x;
          c.y = a.y;
          c.wet = Math.max(c.wv > 0 ? c.wv * Math.exp(-(W.t - c.wvT) / WET_TAU) : 0, a.wetT > 0 ? 1 : 0);
          const ev = entityTick(W, c, dt, envFor(W));
          const onFire = i >= 0 && W.F.fireAt && W.F.fireAt[i];
          if (kind === "E" && c.burning > 0 && !onFire) {
            c.dmg += TUNE.bodyDmgE * dt;
            if (c.dmg >= 6) {
              c.dmg -= 6;
              A().damageEnemy(W.F, a, 6, 0, {
                kind: "enemy",
                alive: false,
                type: "fire"
              });
            }
          }
          if (ev.length && kind !== "P" && SX.audio) for (const e of ev) if (e.type === "entity_ignite") SX.audio.play("flare", {
            x: a.x,
            y: a.y,
            f: a.floor,
            range: 16,
            vol: .5
          });
        }
      } else if (c && c.burning > 0) c.burning = 0;
      if (R_()) {
        const fl = (c && c.burning > 0 ? 1 : 0) | (c && c.shockT > 0 ? 2 : 0);
        if ((boSent.get(key) | 0) !== fl) {
          boSent.set(key, fl);
          flags.push([ key, fl ]);
        }
      }
    }
    if (flags.length) send({
      bo: flags
    });
  }
  function gens() {
    const out = [];
    const S = SX.bdev && SX.bdev._S ? SX.bdev._S() : null;
    if (S && S.d && S.d.k === "hos" && S.d.st >= 1 && S.d.gen) out.push({
      f: S.d.gen.f,
      x: S.d.gen.x,
      y: S.d.gen.y,
      w: S.d.gen.w || 2,
      h: S.d.gen.h || 1
    });
    const MS = SX.mis && SX.mis._S ? SX.mis._S() : null, P = MS && MS.k && MS.k.power;
    if (P && P.g) out.push({
      f: P.gf,
      x: P.gx,
      y: P.gy,
      w: 2,
      h: 1
    });
    for (const g of CH.testGens) out.push(g);
    return out;
  }
  function conductsAt(W, i) {
    return floodWet(W) || !TUNE.shockFloodOnly && wetAt(W, i) >= .5;
  }
  function doShock(W, cx, cy, snd) {
    const r = shock(W, cx, cy, TUNE.shockPower, {
      maxCells: TUNE.shockMax
    });
    W.fx = new Set(r.cells);
    W.fxT = .4;
    const F = W.F, now = Rd() ? Rd().t || 0 : 0;
    for (const [a, id, key, kind] of bodyList()) {
      if (a.floor !== W.f) continue;
      const xi = Math.floor(a.x), yi = Math.floor(a.y);
      if (!F.in(xi, yi) || !W.fx.has(yi * W.w + xi)) continue;
      if (!gate.allow(id, "shock", now)) continue;
      const c = chemOf(a, id);
      c.shockT = TUNE.shockStun;
      if (kind === "E") A().damageEnemy(F, a, TUNE.shockDmg, 0, {
        kind: "enemy",
        alive: false,
        type: "fire"
      });
    }
    if (SX.audio) SX.audio.play(snd || "flashCrack", {
      x: cx + .5,
      y: cy + .5,
      f: W.f,
      range: 22,
      vol: snd ? .6 : .3
    });
    const a = A();
    if (a.part && a.FX) for (let k = 0; k < 6; k++) {
      const i = r.cells[k * 7 % r.cells.length], an = k * 1.05;
      a.part({
        floor: W.f,
        x: i % W.w + .5,
        y: (i / W.w | 0) + .5,
        z: .2,
        vx: Math.cos(an) * 3,
        vy: Math.sin(an) * 3,
        vz: 1.5,
        g: 8,
        c: a.FX.spark,
        t: .25,
        life: .25
      });
    }
    if (R_() && r.cells.length) {
      const u = new Uint16Array(r.cells);
      send({
        sh: [ W.f, b64(new Uint8Array(u.buffer)), snd || "" ]
      });
    }
    return r;
  }
  function shockCheck() {
    for (const g of gens()) {
      const W = WORLDS.get(g.f) || (floodWet({
        f: g.f
      }) ? world(g.f) : null);
      if (!W) continue;
      let hit = -1;
      for (let y = g.y - 1; y <= g.y + g.h && hit < 0; y++) for (let x = g.x - 1; x <= g.x + g.w && hit < 0; x++) {
        if (!W.F.in(x, y)) continue;
        const i = y * W.w + x;
        if (W.F.solid[i]) continue;
        if (conductsAt(W, i)) hit = i;
      }
      if (hit >= 0) doShock(W, hit % W.w, hit / W.w | 0);
    }
    const lv = Rd() && Rd().level;
    if (lv) for (const F of lv.floors) {
      const g = F && F.ePanel;
      if (!g) continue;
      const W = world(g.f);
      if (!W) continue;
      let on = false;
      for (const [a] of bodyList()) {
        if (a.floor !== g.f) continue;
        const xi = Math.floor(a.x), yi = Math.floor(a.y);
        if (!W.F.in(xi, yi) || Math.abs(xi - g.x - .5) > TUNE.panelNear || Math.abs(yi - g.y) > TUNE.panelNear) continue;
        if (conductsAt(W, yi * W.w + xi)) {
          on = true;
          break;
        }
      }
      if (!on) continue;
      let hit = -1;
      for (let y = g.y - 1; y <= g.y + g.h && hit < 0; y++) for (let x = g.x - 1; x <= g.x + g.w && hit < 0; x++) {
        if (!W.F.in(x, y)) continue;
        const i = y * W.w + x;
        if (W.F.solid[i]) continue;
        if (conductsAt(W, i)) hit = i;
      }
      if (hit >= 0) {
        doShock(W, hit % W.w, hit / W.w | 0, "elecZap");
        g.shocks = (g.shocks | 0) + 1;
      }
    }
  }
  CH.rainPanel = function(lv, seed, b, env) {
    if (!lv || !b || b.train || b.outdoor || b.final || !env || !(env.rain > 0)) return null;
    const M = SX.map, T = M.T, g = new SX.Rng((seed >>> 0 ^ 1590157733) >>> 0 || 1);
    if (g.f() >= TUNE.panelP) return null;
    const byF = [];
    lv.floors.forEach((F, f) => {
      if (!F || F.kind !== "floor" || !F.inside) return;
      const L = [], W = F.W;
      const zoneAt = (x, y) => (F.zones || []).some(z => x >= z.x && x < z.x + z.w && y >= z.y && y < z.y + z.h);
      const free = (x, y) => F.in(x, y) && F.tile(x, y) === T.FLOOR && !F.solid[y * W + x] && !F.propAt[y * W + x] && F.inside[y * W + x] && !zoneAt(x, y);
      for (let y = 1; y < F.H - 4; y++) for (let x = 3; x < W - 4; x++) {
        if (F.tile(x, y) !== T.WINDOW || !free(x, y + 1)) continue;
        const up = F.tile(x, y - 1);
        if (up === T.FLOOR || up === T.STAIR || up === T.DOOR) continue;
        for (const sd of [ 1, -1 ]) {
          const px = sd > 0 ? x + 1 : x - 2;
          if (F.tile(px, y) !== T.WALL || F.tile(px + 1, y) !== T.WALL || !free(px, y + 1) || !free(px + 1, y + 1)) continue;
          let ok = true;
          for (let yy = y; yy <= y + 3 && ok; yy++) for (let xx = px - 2; xx <= px + 3 && ok; xx++) {
            const t = F.tile(xx, yy);
            if (t === T.DOOR || t === T.STAIR) ok = false;
          }
          for (let yy = y + 2; yy <= y + 3 && ok; yy++) for (let xx = px - 1; xx <= px + 2 && ok; xx++) if (!free(xx, yy)) ok = false;
          if (ok && A().enemies.some(e => e.floor === f && Math.floor(e.y) === y + 1 && Math.floor(e.x) >= px && Math.floor(e.x) <= px + 1)) ok = false;
          if (ok) {
            L.push({
              f,
              wx: x,
              wy: y,
              px
            });
            break;
          }
        }
      }
      if (L.length) byF.push(L);
    });
    if (!byF.length) return null;
    const L = byF[g.i(byF.length)], c = L[g.i(L.length)], F = lv.floors[c.f], wi = c.wy * F.W + c.wx;
    const pr = M.addProp(F, "elecPanel", c.px, c.wy + 1, {
      solid: true,
      cover: .8
    });
    if (!pr) return null;
    (F.winBroken || (F.winBroken = new Set)).add(wi);
    (F.winPre || (F.winPre = new Set)).add(wi);
    const wet = [], seen = new Set([ wi + F.W ]), q = [ [ c.wx, c.wy + 1 ] ];
    while (q.length) {
      const [x, y] = q.shift(), i = y * F.W + x;
      wet.push(i);
      for (const [dx, dy] of [ [ 1, 0 ], [ -1, 0 ], [ 0, 1 ], [ 0, -1 ] ]) {
        const nx = x + dx, ny = y + dy, j = ny * F.W + nx;
        if (seen.has(j) || ny <= c.wy || !F.in(nx, ny) || Math.hypot(nx - c.wx, ny - c.wy - .5) > TUNE.panelWetR) continue;
        seen.add(j);
        const t = F.tile(nx, ny);
        if (t !== T.FLOOR || F.solid[j] || !F.inside[j]) continue;
        q.push([ nx, ny ]);
      }
    }
    F.ePanel = {
      f: c.f,
      x: c.px,
      y: c.wy + 1,
      w: 2,
      h: 1,
      wx: c.wx,
      wy: c.wy,
      wet,
      warned: false,
      spT: 1
    };
    return F.ePanel;
  };
  let newT = 0;
  const vkFloor = new Map;
  function newFloors() {
    const lv = Rd() && Rd().level;
    if (!lv) return;
    lv.floors.forEach((F, f) => {
      if (!F || WORLDS.has(f) || !F.fireAt) return;
      const k = vk(F);
      if (vkFloor.get(f) === k) return;
      vkFloor.set(f, k);
      if (F.fireAt.some(v => v)) world(f);
    });
  }
  function fixed(dt) {
    const host = auth();
    if (host) {
      newT -= dt;
      if (newT <= 0) {
        newT = 1;
        newFloors();
      }
      for (const W of WORLDS.values()) stepWorld(W, dt);
      bodies(dt);
      shockT -= dt;
      if (shockT <= 0) {
        shockT = TUNE.shockEvery;
        shockCheck();
      }
    } else for (const W of WORLDS.values()) W.t += dt;
    for (const W of WORLDS.values()) flush(W, host);
    if (host && R_()) {
      sumT -= dt;
      if (sumT <= 0) {
        sumT = TUNE.sumEvery;
        const s = [];
        for (const W of WORLDS.values()) s.push([ W.f, checksum(W) ]);
        const bo = [];
        for (const [k, v] of boSent) if (v) bo.push([ k, v ]);
        send({
          sum: s,
          bo
        });
      }
    }
  }
  function local(dt, F, p, G) {
    const a = A(), R = Rd();
    for (const b of [ p ].concat(a.enemies, SX.coop && R_() && SX.coop.ghosts ? Array.from(SX.coop.ghosts.values()) : [])) if (b && b.chem && b.chem.shockT > 0) b.chem.shockT = Math.max(0, b.chem.shockT - dt);
    for (const W of WORLDS.values()) {
      if (W.fxT > 0) {
        W.fxT -= dt;
        if (W.fxT <= 0) W.fx = null;
      }
    }
    const W = WORLDS.get(p.floor);
    const c = p.chem, burn = !!(c && c.burning > 0 && p.alive), sh = !!(c && c.shockT > 0 && p.alive);
    if (burn && !myPrev.burn) SX.log("🔥 몸에 불이 붙었습니다", "bad");
    if (!burn && myPrev.burn && p.alive) SX.log("몸의 불이 꺼졌습니다", "good");
    const tx = Math.floor(p.x), ty = Math.floor(p.y), i = F.in(tx, ty) ? ty * F.W + tx : -1;
    const onFire = i >= 0 && F.fireAt && F.fireAt[i];
    if (p.alive && !G.god) {
      if (burn && !onFire) {
        if (SX.recap) SX.recap.tick("fire", TUNE.bodyDmgP * dt);
        a.rawHurt(TUNE.bodyDmgP * dt, "몸에 붙은 불에 탔습니다");
        p.hurtT = Math.max(p.hurtT || 0, .25);
        SX.ui.hudDirty();
      }
      if (!R.fire && onFire && W && W.own[i]) {
        if (SX.recap) SX.recap.tick("fire", 12 * dt);
        a.rawHurt(12 * dt, "불길에 휩싸였습니다");
        p.hurtT = Math.max(p.hurtT || 0, .25);
        SX.ui.hudDirty();
      }
      if (sh && !myPrev.sh) {
        a.rawHurt(TUNE.shockDmg, "감전되었습니다");
        p.hurtT = Math.max(p.hurtT || 0, .4);
        SX.log("⚡ 감전되었습니다", "bad");
        SX.ui.hudDirty();
      }
    }
    myPrev = {
      burn,
      sh
    };
    if (!R.fire) {
      scanT -= dt;
      if (scanT <= 0) {
        scanT = .25;
        let best = 99;
        if (W && F.fireAt) for (let y = ty - 8; y <= ty + 8; y++) for (let x = tx - 8; x <= tx + 8; x++) if (F.in(x, y) && F.fireAt[y * F.W + x] && W.own[y * F.W + x]) {
          const d = Math.hypot(x + .5 - p.x, y + .5 - p.y);
          if (d < best) best = d;
        }
        CH.near = best < 99 ? Math.max(0, Math.min(1, 1 - best / 9)) : 0;
      }
      if (W && Math.random() < dt * 5) {
        const L = [];
        for (const q of F.props) if (q.kind === "blaze" && W.own[Math.floor(q.y) * F.W + Math.floor(q.x)]) L.push(q);
        if (L.length) {
          const q = L[Math.random() * L.length | 0];
          if (Math.abs(q.x - p.x) < 24 && Math.abs(q.y - p.y) < 16) a.smoke(F, q.x + .5, q.y + .3, 1, true);
        }
      }
      if (auth()) {
        dmgT -= dt;
        if (dmgT <= 0) {
          dmgT = .5;
          for (const e of a.enemies) {
            if (!e.alive) continue;
            const EW = WORLDS.get(e.floor);
            if (!EW) continue;
            const ex = Math.floor(e.x), ey = Math.floor(e.y);
            if (!EW.F.in(ex, ey)) continue;
            const j = ey * EW.w + ex;
            if (EW.own[j] && EW.F.fireAt && EW.F.fireAt[j]) a.damageEnemy(EW.F, e, 6, 0, {
              kind: "enemy",
              alive: false,
              type: "fire"
            });
          }
        }
      }
    } else CH.near = 0;
    const EP = F.ePanel;
    if (EP && !R.over) {
      EP.spT -= dt;
      if (EP.spT <= 0) {
        EP.spT = 1.4 + Math.random() * 3.4;
        if (Math.abs(EP.x + 1 - p.x) < 22 && Math.abs(EP.y - p.y) < 14) {
          const sx = EP.x + .3 + Math.random() * 1.4, sy = EP.y + .55, n = 3 + (Math.random() * 5 | 0);
          if (a.part && a.FX) for (let k = 0; k < n; k++) {
            const an = Math.PI * (.15 + Math.random() * .7), v = 1.5 + Math.random() * 3;
            a.part({
              floor: F.idx,
              x: sx,
              y: sy,
              z: 1.1 + Math.random() * .4,
              vx: Math.cos(an) * v * (Math.random() < .5 ? -1 : 1),
              vy: Math.sin(an) * v * .4,
              vz: 1 + Math.random() * 2.5,
              g: 9,
              c: k & 1 ? "#e6f6ff" : "#8fd0ff",
              t: .3,
              life: .3
            });
          }
          if (SX.light && SX.light.flash) SX.light.flash(F.idx, sx, sy - .6, 2.6, [ 170, 215, 255 ], .4, .22);
          if (SX.audio) SX.audio.play("elecSpark", {
            x: sx,
            y: sy,
            f: F.idx,
            range: 12,
            vol: .45
          });
        }
      }
      if (!EP.warned && p.alive && Math.hypot(EP.x + 1 - p.x, EP.y + .5 - p.y) < 6) {
        EP.warned = true;
        SX.log("⚡ 깨진 창으로 들이친 빗물이 배전반에 닿아 있습니다 — 젖은 바닥을 밟으면 감전됩니다", "bad");
      }
    }
    smokeT -= dt;
    if (smokeT <= 0 && SX.light && SX.light.flash) {
      smokeT = .25;
      for (const b of [ p ].concat(a.enemies, SX.coop && R_() && SX.coop.ghosts ? Array.from(SX.coop.ghosts.values()) : [])) if (b && b.chem && b.chem.burning > 0 && b.alive !== false && b.floor === p.floor) SX.light.flash(b.floor, b.x, b.y - .5, 3, [ 255, 130, 50 ], .3, .55);
    }
  }
  CH.tick = function(dt, lv, F, p, G) {
    if (!CH.on || !lv || !F || !p) return;
    if (lv !== lvRef) reset(lv);
    if (!CH.boot) {
      CH.boot = 1;
      lv.floors.forEach((F2, f) => {
        if (F2 && F2.fireAt && F2.fireAt.some(v => v)) world(f); else if (F2 && (F2.props || []).some(q => q.kind === "fire")) world(f);
        if (F2 && F2.ePanel) world(f);
      });
    }
    const t0 = performance.now();
    acc += dt;
    let n = 0;
    while (acc >= TUNE.dt && n < 3) {
      acc -= TUNE.dt;
      n++;
      fixed(TUNE.dt);
    }
    if (acc > TUNE.dt) acc = 0;
    if (n) {
      const ms = (performance.now() - t0) / n;
      CH.stats.ms = ms;
      CH.stats.ticks += n;
      if (ms > CH.stats.peakMs) CH.stats.peakMs = ms;
    }
    local(dt, F, p, G);
  };
  CH.held = a => !!(a && a.chem && a.chem.shockT > 0);
  function walkable(F, i) {
    const T = SX.map.T, t = F.t[i];
    return t === T.FLOOR || t === T.GROUND || t === T.STAIR;
  }
  CH.molotov = function(F, x, y) {
    if (!CH.on || !F) return 0;
    if (!auth()) {
      send({
        act: "mo",
        f: F.idx,
        x: +x,
        y: +y
      });
      return 0;
    }
    const W = world(F.idx);
    if (!W) return 0;
    const cx = Math.floor(x), cy = Math.floor(y), r = TUNE.oilR, R = Math.ceil(r);
    for (let yy = cy - R; yy <= cy + R; yy++) for (let xx = cx - R; xx <= cx + R; xx++) {
      if (!F.in(xx, yy) || (xx - cx) * (xx - cx) + (yy - cy) * (yy - cy) > r * r) continue;
      const i = yy * W.w + xx;
      if (!walkable(F, i) || F.solid[i] || W.burn[i] || W.mat[i] !== STONE && W.mat[i] !== ASH) continue;
      W.mat[i] = OIL;
      W.fuel[i] = W.C.FUEL[OIL];
      W.wet[i] = 0;
      mark(W, i);
    }
    const n = igniteArea(W, cx, cy, Math.ceil(r));
    if (SX.audio) SX.audio.play("flare", {
      x: cx + .5,
      y: cy + .5,
      f: F.idx,
      range: 24,
      vol: .9
    });
    flush(W, true);
    return n;
  };
  CH.blast = function(F, x, y) {
    if (!CH.on || !F || !auth()) return 0;
    const W = world(F.idx);
    if (!W) return 0;
    const cx = Math.floor(x), cy = Math.floor(y), r = TUNE.blastR;
    let n = 0;
    for (let yy = cy - r; yy <= cy + r; yy++) for (let xx = cx - r; xx <= cx + r; xx++) {
      if (!F.in(xx, yy)) continue;
      const i = yy * W.w + xx;
      if (W.C.F[W.mat[i]] >= TUNE.blastMin && igniteAt(W, xx, yy)) n++;
    }
    if (n) flush(W, true);
    return n;
  };
  function wetCells(W, cx, cy, r) {
    for (let y = cy - r; y <= cy + r; y++) for (let x = cx - r; x <= cx + r; x++) if (W.F.in(x, y) && (x - cx) * (x - cx) + (y - cy) * (y - cy) <= r * r) W.wetSet.add(y * W.w + x);
  }
  CH.splash = function(F, x, y, r) {
    if (!CH.on || !F) return null;
    r = r == null ? TUNE.splashR : r;
    if (!auth()) {
      send({
        act: "sp",
        f: F.idx,
        x: +x,
        y: +y,
        r
      });
      return null;
    }
    const W = world(F.idx);
    if (!W) return null;
    const cx = Math.floor(x), cy = Math.floor(y), res = splash(W, cx, cy, Math.ceil(r));
    wetCells(W, cx, cy, Math.ceil(r));
    for (const [a, id] of bodyList()) {
      if (a.floor !== F.idx || Math.hypot(a.x - cx - .5, a.y - cy - .5) > r + .5) continue;
      const c = chemOf(a, id);
      c.wv = 1;
      c.wvT = W.t;
      if (c.burning > 0) c.burning = 0;
    }
    if (R_()) send({
      sp: [ F.idx, cx, cy, Math.ceil(r), W.t ]
    });
    flush(W, true);
    return res;
  };
  CH.shock = function(F, x, y) {
    if (!CH.on || !F || !auth()) return null;
    const W = world(F.idx);
    if (!W) return null;
    const r = doShock(W, Math.floor(x), Math.floor(y));
    flush(W, true);
    return r;
  };
  function diffBuf(W) {
    const L = [];
    for (let i = 0; i < W.N; i++) if (W.mat[i] !== W.base0[i] || W.burn[i] !== W.burn0[i]) L.push(i);
    const buf = new Uint8Array(L.length * 4);
    L.forEach((j, b) => {
      const o = b * 4;
      buf[o] = j & 255;
      buf[o + 1] = j >>> 8 & 255;
      buf[o + 2] = j >>> 16 & 255;
      buf[o + 3] = W.mat[j] & 127 | (W.burn[j] ? 128 : 0);
    });
    return buf;
  }
  function applyBuf(W, buf, full) {
    if (full) {
      W.mat.set(W.base0);
      W.burn.set(W.burn0);
      W.fuel.set(W.fuel0);
      for (let i = 0; i < W.N; i++) if (W.mirror[i] || W.burn[i] || W.mat[i] === OIL || W.F.oilAt && W.F.oilAt[i]) W.changed.push(i);
    }
    for (let o = 0; o + 3 < buf.length; o += 4) {
      const j = buf[o] | buf[o + 1] << 8 | buf[o + 2] << 16;
      if (j < W.N) W.changed.push(j);
    }
    applyChanges(W, buf);
    for (let o = 0; o + 3 < buf.length; o += 4) {
      const j = buf[o] | buf[o + 1] << 8 | buf[o + 2] << 16;
      if (j < W.N && W.fuel[j] <= 0) W.fuel[j] = W.C.FUEL[W.mat[j]];
    }
    W.burning = [];
    for (let i = 0; i < W.N; i++) if (W.burn[i]) W.burning.push(i);
    reburn(W);
  }
  function bodyByKey(k) {
    const a = A(), R = R_();
    if (R && k === "p" + R.me) return a.player;
    if (k[0] === "p" && SX.coop && SX.coop.ghosts) for (const g of SX.coop.ghosts.values()) if ("p" + g.pid === k) return g;
    if (k[0] === "e") for (const e of a.enemies) if ("e" + e.nid === k) return e;
    return null;
  }
  function takeFlags(L) {
    for (const it of L || []) {
      if (!Array.isArray(it)) continue;
      const b = bodyByKey(String(it[0]));
      if (!b) continue;
      const fl = it[1] | 0, c = chemOf(b, idNum(it[0]));
      c.burning = fl & 1 ? 1 : 0;
      if (fl & 2 && !c.shWas) c.shockT = TUNE.shockStun;
      c.shWas = !!(fl & 2);
    }
  }
  CH.onMsg = function(from, d) {
    if (!CH.on || !d) return;
    const R = R_();
    if (!R || d.s != null && d.s !== R.seed) return;
    const host = auth();
    if (host) {
      if (typeof d.rq === "number") {
        const W = WORLDS.get(d.rq);
        if (W) send({
          f: W.f,
          full: 1,
          b: b64(diffBuf(W))
        }, from);
        return;
      }
      if (d.act && typeof d.f === "number") {
        const lv = Rd().level, F = lv && lv.floors[d.f];
        if (!F) return;
        if (d.act === "mo") CH.molotov(F, +d.x || 0, +d.y || 0); else if (d.act === "sp") CH.splash(F, +d.x || 0, +d.y || 0, Math.min(4, +d.r || TUNE.splashR));
      }
      return;
    }
    if (from !== R.auth) return;
    if (typeof d.f === "number") {
      const W = world(d.f);
      if (!W) return;
      if (d.b) applyBuf(W, unb64(d.b), !!d.full);
      if (Array.isArray(d.st)) for (const i of d.st) if (i >= 0 && i < W.N) W.events.push({
        type: "steam",
        i: i | 0
      });
      flush(W, false);
    }
    if (Array.isArray(d.sp)) {
      const W = world(d.sp[0] | 0);
      if (W) {
        const cx = d.sp[1] | 0, cy = d.sp[2] | 0, r = d.sp[3] | 0;
        for (let y = cy - r; y <= cy + r; y++) for (let x = cx - r; x <= cx + r; x++) if (W.F.in(x, y) && (x - cx) * (x - cx) + (y - cy) * (y - cy) <= r * r) {
          const i = y * W.w + x;
          W.wet[i] = 1;
          W.wetT[i] = W.t;
        }
        wetCells(W, cx, cy, r);
      }
    }
    if (Array.isArray(d.sh)) {
      const W = world(d.sh[0] | 0);
      if (W) {
        const u = unb64(d.sh[1]), c16 = new Uint16Array(u.buffer, 0, u.length >> 1);
        W.fx = new Set(Array.from(c16));
        W.fxT = .4;
        const i = c16[0] | 0;
        const sn = d.sh[2] === "elecZap" ? "elecZap" : "";
        if (SX.audio) SX.audio.play(sn || "flashCrack", {
          x: i % W.w + .5,
          y: (i / W.w | 0) + .5,
          f: W.f,
          range: 22,
          vol: sn ? .6 : .3
        });
      }
    }
    if (d.bo) takeFlags(d.bo);
    if (Array.isArray(d.sum)) {
      rqT = rqT || 0;
      const now = performance.now();
      for (const it of d.sum) {
        const W = world(it[0] | 0);
        if (!W) continue;
        if (checksum(W) !== it[1] >>> 0 && now - rqT > 4e3) {
          rqT = now;
          send({
            rq: W.f
          }, R.auth);
          CH.stats.resync = (CH.stats.resync | 0) + 1;
        }
      }
    }
  };
  CH.dump = function() {
    if (!WORLDS.size) return undefined;
    const w = [];
    for (const W of WORLDS.values()) {
      const b = diffBuf(W);
      if (b.length) w.push([ W.f, b64(b) ]);
    }
    return w.length ? {
      w
    } : undefined;
  };
  CH.worldIn = function(d) {
    if (!CH.on || !d || !Array.isArray(d.w)) return;
    const R = Rd();
    if (R && R.level !== lvRef) reset(R.level);
    for (const it of d.w) {
      if (!Array.isArray(it)) continue;
      const W = world(it[0] | 0);
      if (!W) continue;
      applyBuf(W, unb64(it[1]), true);
      flush(W, false);
    }
  };
  CH.auditCfg = function(F) {
    const b = baseMats(F);
    return {
      elements: ELEMENTS,
      materials: MATERIALS,
      table: TABLE,
      entities: [ {
        kind: "player",
        mat: "flesh"
      }, {
        kind: "scav",
        mat: "flesh"
      }, {
        kind: "zombie",
        mat: "flesh"
      } ],
      env: {
        cap: TUNE.cap,
        genMax: TUNE.genMax,
        spreadK: TUNE.spreadK,
        wind: {
          x: 0,
          y: 0
        }
      },
      map: s => {
        const W = makeWorld(F.W, F.H, {
          seed: 7 + s * 101,
          table: TABLE,
          materials: MATERIALS,
          elements: ELEMENTS,
          fill: "stone"
        });
        for (let i = 0; i < W.N; i++) {
          W.mat[i] = b[i];
          W.fuel[i] = W.C.FUEL[b[i]];
        }
        return W;
      },
      server: {
        tickHz: Math.round(1 / TUNE.dt)
      }
    };
  };
  CH.baseMats = baseMats;
  function hsh(a, b) {
    let h = Math.imul(a ^ 2654435761, 2246822507) ^ Math.imul(b + 668265263, 3266489909);
    h ^= h >>> 15;
    h = Math.imul(h, 739982445);
    return (h ^ h >>> 12) >>> 0;
  }
  CH.drawFloor = function(ctx, F, cam, now, tx0, ty0, tx1, ty1) {
    const W = CH.on && F && live() ? WORLDS.get(F.idx) : null;
    if (!W || W.F !== F) return;
    const ts = TS(), w = W.w;
    const cell = i => {
      const x = i % w, y = i / w | 0;
      return x >= tx0 - 1 && x <= tx1 + 1 && y >= ty0 - 1 && y <= ty1 + 1 ? [ x, y, Math.round(x * ts - cam.x), Math.round(y * ts - cam.y) ] : null;
    };
    if (W.wetSet.size) {
      for (const i of W.wetSet) {
        const wv = wetAt(W, i);
        if (wv < .15) {
          W.wetSet.delete(i);
          continue;
        }
        const q = cell(i);
        if (!q) continue;
        ctx.fillStyle = "rgba(24,40,64," + (Math.round(wv * 6) / 20).toFixed(2) + ")";
        ctx.fillRect(q[2] + 1, q[3] + 1, ts - 2, ts - 2);
      }
    }
    if (W.rw && F.ePanel) {
      for (const i of F.ePanel.wet) {
        const q = cell(i);
        if (!q) continue;
        const [x, y, px, py] = q;
        ctx.fillStyle = "rgba(30,48,72,0.42)";
        ctx.fillRect(px + 1, py + 1, ts - 2, ts - 2);
        ctx.fillStyle = "#3c5878";
        for (let k = 0; k < 3; k++) {
          const h = hsh(i, k + 11);
          ctx.fillRect(px + 3 + h % (ts - 10), py + 3 + (h >>> 8) % (ts - 8), 3 + (h >>> 16) % 4, 1);
        }
        for (let k = 0; k < 2; k++) {
          const h = hsh(i, k + 31), ph = (now * (.9 + h % 7 / 10) + h % 100 / 100) % 1;
          if (ph > .8) continue;
          const r = 1 + Math.floor(ph * 5), cx = px + 6 + (h >>> 4) % (ts - 12), cy = py + 6 + (h >>> 12) % (ts - 12);
          ctx.fillStyle = ph < .45 ? "#a8c4dc" : "#6e8eae";
          ctx.fillRect(cx - r, cy, 1, 1);
          ctx.fillRect(cx + r, cy, 1, 1);
          ctx.fillRect(cx, cy - Math.max(1, r >> 1), 1, 1);
          ctx.fillRect(cx, cy + Math.max(1, r >> 1), 1, 1);
          if (r > 2) {
            ctx.fillRect(cx - r + 1, cy - 1, 1, 1);
            ctx.fillRect(cx + r - 1, cy - 1, 1, 1);
            ctx.fillRect(cx - r + 1, cy + 1, 1, 1);
            ctx.fillRect(cx + r - 1, cy + 1, 1, 1);
          }
        }
      }
    }
    if (W.oil.size) {
      for (const i of W.oil) {
        const q = cell(i);
        if (!q) continue;
        const [x, y, px, py] = q;
        ctx.fillStyle = "rgba(34,26,14,0.82)";
        ctx.fillRect(px + 2, py + 2, ts - 4, ts - 4);
        ctx.fillStyle = "#4a3c24";
        for (let k = 0; k < 5; k++) {
          const h = hsh(i, k);
          ctx.fillRect(px + 4 + h % (ts - 10), py + 4 + (h >>> 8) % (ts - 10), 2, 1);
        }
        const s = Math.floor(now * 2) + x + y & 3;
        ctx.fillStyle = "#8a7448";
        ctx.fillRect(px + 6 + s * 4, py + 8 + s * 3, 3, 1);
      }
    }
    if (W.fx && W.fxT > 0) {
      const fr = Math.floor(now * 30);
      for (const i of W.fx) {
        const q = cell(i);
        if (!q) continue;
        const [x, y, px, py] = q;
        if (!walkable(F, i)) continue;
        let ax = px + 4 + hsh(i, fr) % 8, ay = py + 4 + (hsh(i, fr) >>> 4) % 8;
        ctx.fillStyle = fr + x + y & 1 ? "#e6f6ff" : "#8fd0ff";
        for (let s = 0; s < 6; s++) {
          const h = hsh(i * 7 + s, fr);
          const dx = 2 + h % 3, dy = (h >>> 3) % 5 - 2;
          for (let k = 0; k < dx; k++) ctx.fillRect(ax + k, ay + Math.round(dy * k / dx), 1, 1);
          ax += dx;
          ay += dy;
          if (ax > px + ts - 3) break;
        }
      }
    }
  };
  function flames(ctx, px, py, now, a) {
    const fr = Math.floor(now * 8), sd = (a.nid | 0) * 13 + (a.x * 3 | 0) & 1023;
    const cols = [ -7, -5, -3, -1, 1, 3, 5 ];
    for (let n = 0; n < cols.length; n++) {
      const h0 = hsh(fr * 31 + n, sd), edge = 1 - Math.abs(cols[n] + 1) / 10;
      const h = Math.round((12 + h0 % 18) * edge), x = px + cols[n], y = py - 4;
      ctx.fillStyle = "#c8381a";
      ctx.fillRect(x, y - h, 2, h);
      ctx.fillStyle = "#f07a1c";
      ctx.fillRect(x, y - Math.round(h * .66), 2, Math.round(h * .66));
      ctx.fillStyle = "#ffd04a";
      ctx.fillRect(x, y - Math.round(h * .3), 2, Math.round(h * .3));
      if (h0 >>> 6 & 1) {
        ctx.fillStyle = "#ff9a2a";
        ctx.fillRect(x + (h0 >>> 7 & 1), y - h - 3 - (h0 >>> 8) % 4, 1, 1);
      }
    }
  }
  function arcs(ctx, px, py, now) {
    const fr = Math.floor(now * 30);
    for (let b = 0; b < 3; b++) {
      let x = px - 6 + hsh(b, fr) % 12, y = py - 30 + (hsh(b, fr) >>> 5) % 22;
      ctx.fillStyle = b === 0 ? "#ffffff" : "#9fdcff";
      for (let s = 0; s < 5; s++) {
        const h = hsh(b * 11 + s, fr);
        const dx = h % 7 - 3, dy = (h >>> 3) % 7 - 3, m = Math.max(1, Math.abs(dx), Math.abs(dy));
        for (let k = 0; k < m; k++) ctx.fillRect(x + Math.round(dx * k / m), y + Math.round(dy * k / m), 1, 1);
        x += dx;
        y += dy;
      }
    }
  }
  CH.drawBody = function(ctx, a, cam, now, dim, inner) {
    if (!live()) return inner(ctx, a, cam, now, dim);
    const c = a.chem, al = a.alive !== false, burn = al && c.burning > 0, sh = al && c.shockT > 0;
    if (!burn && !sh) return inner(ctx, a, cam, now, dim);
    const ts = TS(), px = Math.round(a.x * ts - cam.x), py = Math.round(a.y * ts - cam.y);
    let j = 0;
    if (sh) {
      j = Math.floor(now * 30) & 1 ? 1 : -1;
      ctx.save();
      ctx.translate(j, 0);
      inner(ctx, a, cam, now, dim);
      ctx.restore();
    } else inner(ctx, a, cam, now, dim);
    if (burn) flames(ctx, px + j, py, now, a);
    if (sh) arcs(ctx, px + j, py, now);
  };
})();
