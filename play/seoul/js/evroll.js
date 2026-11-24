(function(root) {
  "use strict";
  const IN = {
    villa: 1,
    office: 1,
    mall: 1,
    hos: 1,
    school: 1,
    metro: 1,
    base: 1
  };
  const P = {
    b: .35,
    c: .25,
    d: .35,
    real: .6,
    sup: 1 / 3
  };
  const BONUS = {
    villa: 29e4,
    office: 5e5,
    mall: 77e4,
    hos: 112e4,
    school: 52e4,
    metro: 86e4,
    base: 135e4
  };
  const ALLOW = {
    c: 6e6,
    sup: 15e5,
    trap: 25e5
  };
  function rnd(seed) {
    let a = Math.imul(seed >>> 0, 1000003) + 1592594689 >>> 0;
    return function() {
      a = a + 1831565813 >>> 0;
      let t = a;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function roll(bid, seed, mode, floors) {
    const f = rnd(seed);
    const rB = f(), rC = f(), rD = f(), rT = f(), rReal = f(), rSup = f(), rN = f(), rClue = f(), rFake = f(), rSeed = f();
    const ind = !!IN[bid];
    const real = rReal < P.real;
    const o = {
      b: ind && rB < P.b,
      c: ind && bid !== "villa" && rC < P.c && (mode == null || mode === "normal" && (floors | 0) >= 3),
      d: ind && rD < P.d,
      cT: 120 + Math.round(rT * 120),
      real,
      sup: real && rSup < P.sup,
      trapN: 3 + (rN < .5 ? 0 : 1),
      clue: Math.floor(rClue * 3),
      fake: rFake < .5,
      s2: Math.floor(rSeed * 4294967296) >>> 0,
      bonus: BONUS[bid] || 0
    };
    return o;
  }
  function allow(bid, seed) {
    const r = roll(bid, seed);
    if (!IN[bid]) return 0;
    let a = 0;
    if (r.b) a += r.bonus;
    if (r.d && r.real && !r.sup) a += r.bonus;
    if (bid !== "villa" && r.c) a += ALLOW.c;
    if (r.d && r.sup) a += ALLOW.sup;
    if (r.d && !r.real) a += ALLOW.trap;
    return a;
  }
  const api = {
    roll,
    allow,
    BONUS,
    ALLOW,
    P,
    IN
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else if (root && root.SX) root.SX.evRoll = api;
})(typeof window !== "undefined" ? window : null);
