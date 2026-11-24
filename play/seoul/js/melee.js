"use strict";

(function(SX) {
  const ME = SX.melee = {};
  const NAME = {
    소방도끼: "two",
    야구방망이: "two",
    하키스틱: "two",
    장도리: "one",
    캠핑도끼: "one",
    몽키렌치: "one",
    스패너: "one",
    식칼: "knife",
    군용칼: "knife",
    스크류드라이버: "stab"
  };
  const STYLE = {
    bat: "two",
    sledge: "two",
    shovel: "two",
    hockey: "two",
    club: "two",
    axe: "one",
    wrench: "one",
    pipe: "one",
    crowbar: "one",
    machete: "one",
    hammer: "one",
    knife: "knife",
    pick: "stab",
    awl: "stab"
  };
  const SEQ = {
    two: [ "heavy" ],
    one: [ "swing", "back" ],
    knife: [ "stab", "slash" ],
    stab: [ "stab" ]
  };
  ME.NAME = NAME;
  ME.STYLE = STYLE;
  ME.SEQ = SEQ;
  ME.cls = function(def) {
    if (!def || def.kind !== "melee" || def.name === "맨주먹" || SX.actors && def === SX.actors.FIST) return null;
    return NAME[def.name] || STYLE[def.style] || ((def.h || 1) >= 3 ? "two" : "one");
  };
  ME.two = def => ME.cls(def) === "two";
  ME.label = def => {
    const c = ME.cls(def);
    return c === "two" ? "양손" : c ? "한손" : "";
  };
  const AI = {
    two: {
      cool: 1.35,
      dmg: 1.35
    },
    one: {
      cool: .75,
      dmg: .75
    }
  };
  ME.ai = def => {
    const c = ME.cls(def);
    return c ? c === "two" ? AI.two : AI.one : null;
  };
  ME.KIND = {
    heavy: {
      w: .22,
      s: .09,
      f: .12,
      b: .27,
      arc: 1.25,
      reach: 0,
      snd: "meleeHeavy",
      W: {
        a: -2.5,
        h: .6,
        fw: -4,
        up: 5,
        ln: -1,
        tw: 1,
        sd: 6
      },
      S: {
        a: .9,
        h: -.15,
        fw: 4,
        up: -1,
        ln: 1.5,
        tw: .8,
        sd: -1
      },
      F: {
        a: 1.5,
        h: -.3,
        fw: 2,
        up: -2,
        ln: 1,
        tw: 1,
        sd: -4
      }
    },
    swing: {
      w: .07,
      s: .06,
      f: .03,
      b: .12,
      arc: .95,
      reach: 0,
      snd: "meleeLight",
      W: {
        a: -1.2,
        h: .35,
        fw: -2,
        up: 3,
        ln: -.5,
        tw: .5,
        sd: 3
      },
      S: {
        a: 1,
        h: -.1,
        fw: 3,
        up: 0,
        ln: .8,
        tw: .5,
        sd: -1
      },
      F: {
        a: 1.15,
        h: -.15,
        fw: 2,
        up: 0,
        ln: .6,
        tw: .3,
        sd: -2
      }
    },
    back: {
      w: .07,
      s: .06,
      f: .03,
      b: .12,
      arc: .95,
      reach: 0,
      snd: "meleeLight",
      W: {
        a: 1.2,
        h: -.2,
        fw: -2,
        up: -1,
        ln: -.5,
        tw: .5,
        sd: -3
      },
      S: {
        a: -1,
        h: .3,
        fw: 3,
        up: 1,
        ln: .8,
        tw: .5,
        sd: 1
      },
      F: {
        a: -1.15,
        h: .35,
        fw: 2,
        up: 1,
        ln: .6,
        tw: .3,
        sd: 2
      }
    },
    slash: {
      w: .05,
      s: .05,
      f: .03,
      b: .11,
      arc: .95,
      reach: 0,
      snd: "meleeLight",
      W: {
        a: -1,
        h: .2,
        fw: -1,
        up: 1,
        ln: -.3,
        tw: .4,
        sd: 2
      },
      S: {
        a: .9,
        h: 0,
        fw: 3,
        up: 0,
        ln: .6,
        tw: .4,
        sd: -1
      },
      F: {
        a: 1.05,
        h: 0,
        fw: 2,
        up: 0,
        ln: .4,
        tw: .2,
        sd: -1.5
      }
    },
    stab: {
      w: .06,
      s: .05,
      f: .04,
      b: .1,
      arc: .5,
      reach: .25,
      hit: .9,
      snd: "meleeStab",
      W: {
        a: -.12,
        h: .1,
        fw: -3,
        up: 1,
        ln: -1,
        tw: 0
      },
      S: {
        a: 0,
        h: 0,
        fw: 7,
        up: 0,
        ln: 1.5,
        tw: 0
      },
      F: {
        a: 0,
        h: 0,
        fw: 7,
        up: 0,
        ln: 1.5,
        tw: 0
      }
    }
  };
  ME.ENEMY_HIT = .29;
  ME.ENEMY_HEAVY = 1.3;
  const KEYS = [ "a", "h", "fw", "up", "ln", "tw", "sd" ], Z = {
    a: 0,
    h: 0,
    fw: 0,
    up: 0,
    ln: 0,
    tw: 0,
    sd: 0
  };
  const hitFrac = b => b.hit != null ? b.hit : b.W.a * b.S.a < 0 ? -b.W.a / (b.S.a - b.W.a) : .6;
  const PC = {};
  function prof(kn, who) {
    const key = kn + (who === "enemy" ? ":e" : "");
    let k = PC[key];
    if (k) return k;
    const b = ME.KIND[kn];
    if (!b) return null;
    k = Object.assign({}, b);
    k.hitF = hitFrac(b);
    if (who === "enemy") k.w = kn === "heavy" ? b.w * ME.ENEMY_HEAVY : Math.max(b.w, ME.ENEMY_HIT - b.s * k.hitF);
    k.hitT = k.w + b.s * k.hitF;
    k.T = k.w + b.s + b.f + b.b;
    k.kind = kn;
    PC[key] = k;
    return k;
  }
  ME.prof = prof;
  const ss = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t), eo = t => t <= 0 ? 0 : t >= 1 ? 1 : 1 - (1 - t) * (1 - t);
  ME.at = function(k, e) {
    let A, B, t, ph;
    if (e < k.w) {
      A = Z;
      B = k.W;
      t = ss(e / k.w);
      ph = 0;
    } else if (e < k.w + k.s) {
      A = k.W;
      B = k.S;
      t = (e - k.w) / k.s;
      ph = 1;
    } else if (e < k.w + k.s + k.f) {
      A = k.S;
      B = k.F;
      t = eo((e - k.w - k.s) / k.f);
      ph = 2;
    } else {
      A = k.F;
      B = Z;
      t = ss((e - k.w - k.s - k.f) / k.b);
      ph = 3;
    }
    const o = {
      ph
    };
    for (const q of KEYS) o[q] = (A[q] || 0) + ((B[q] || 0) - (A[q] || 0)) * t;
    return o;
  };
  ME.start = function(a, def, ang, who, n) {
    const c = ME.cls(def);
    if (!c || !a) return null;
    a.punchN = n != null ? n | 0 : (a.punchN | 0) + 1;
    const seq = SEQ[c], kn = seq[(a.punchN % seq.length + seq.length) % seq.length], k = prof(kn, who);
    a.swing = a.swingT = k.T;
    a.swingK = kn;
    a.swingWho = who;
    a.swingSg = Math.cos(ang || 0) < 0 ? -1 : 1;
    a.swingW = def;
    return k;
  };
  ME.active = a => !!(a && a.swing > 0 && a.swingT > 0 && a.swingK && a.swingW);
  ME.held = (a, w) => ME.active(a) && (!w || w.kind !== "melee" || w === a.swingW || w.name === a.swingW.name) ? a.swingW : w;
  ME.STEPS = 128;
  ME.qa = ang => {
    const s = Math.PI * 2 / ME.STEPS;
    return Math.round(ang / s) * s;
  };
  ME.pose = function(a, aim) {
    if (!ME.active(a)) return null;
    const k = prof(a.swingK, a.swingWho);
    if (!k) return null;
    const e = Math.max(0, Math.min(k.T, k.T - a.swing)), q = ME.at(k, e), sg = a.swingSg || 1;
    const th = aim + sg * q.a, vx = Math.cos(th), vy = Math.sin(th) - q.h, L = Math.hypot(vx, vy) || 1, fx = Math.cos(aim), fy = Math.sin(aim);
    const sw = Math.abs(fy) * q.sd;
    return {
      ang: ME.qa(Math.atan2(vy, vx)),
      dx: fx * q.fw + sg * fy * sw,
      dy: fy * q.fw - q.up - sg * fx * sw,
      lean: Math.round(q.ln * fx + q.tw * vx / L),
      wx: vx / L,
      wy: vy / L,
      ph: q.ph,
      e,
      k,
      kind: a.swingK
    };
  };
  const ROT = new WeakMap, UP = new WeakMap;
  function up8(c) {
    let u = UP.get(c);
    if (u) return u;
    let W = c.width, H = c.height, s = new Uint32Array(c.getContext("2d").getImageData(0, 0, W, H).data.buffer);
    for (let k = 0; k < 3; k++) {
      const W2 = W * 2, o = new Uint32Array(W2 * H * 2), at = (x, y) => s[Math.min(H - 1, Math.max(0, y)) * W + Math.min(W - 1, Math.max(0, x))];
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const P = s[y * W + x], up = at(x, y - 1), rt = at(x + 1, y), lf = at(x - 1, y), dn = at(x, y + 1);
        let e0 = P, e1 = P, e2 = P, e3 = P;
        if (up !== dn && lf !== rt) {
          if (lf === up) e0 = lf;
          if (up === rt) e1 = rt;
          if (lf === dn) e2 = lf;
          if (dn === rt) e3 = rt;
        }
        const i = y * 2 * W2 + x * 2;
        o[i] = e0;
        o[i + 1] = e1;
        o[i + W2] = e2;
        o[i + W2 + 1] = e3;
      }
      s = o;
      W = W2;
      H *= 2;
    }
    u = {
      s,
      W,
      H
    };
    UP.set(c, u);
    return u;
  }
  ME.rot = function(wp, ang, flip, fine) {
    if (!wp || !wp.c) return null;
    const S = ME.STEPS, qi = (Math.round(ang / (Math.PI * 2 / S)) % S + S) % S, key = qi * 2 + (flip ? 1 : 0) + (fine ? S * 2 : 0);
    let M = ROT.get(wp.c);
    if (!M) {
      M = new Map;
      ROT.set(wp.c, M);
    }
    let q = M.get(key);
    if (q) return q;
    const a = qi * Math.PI * 2 / S, c = Math.cos(a), s = Math.sin(a), sg = flip ? -1 : 1, W = wp.c.width, H = wp.c.height, x0 = 4 - wp.gx, y0 = -wp.gy;
    let x1 = 1e9, y1 = 1e9, x2 = -1e9, y2 = -1e9;
    for (const [u, v] of [ [ 0, 0 ], [ W, 0 ], [ 0, H ], [ W, H ] ]) {
      const lx = x0 + u, ly = (y0 + v) * sg, X = lx * c - ly * s, Y = lx * s + ly * c;
      x1 = Math.min(x1, X);
      y1 = Math.min(y1, Y);
      x2 = Math.max(x2, X);
      y2 = Math.max(y2, Y);
    }
    const ox = Math.floor(x1) - 1, oy = Math.floor(y1) - 1, w = Math.ceil(x2) - ox + 2, h = Math.ceil(y2) - oy + 2;
    const src = wp.c.getContext("2d").getImageData(0, 0, W, H).data, out = document.createElement("canvas");
    out.width = w;
    out.height = h;
    const g = out.getContext("2d"), id = g.createImageData(w, h), D = id.data;
    if (fine) {
      const U = up8(wp.c), D32 = new Uint32Array(D.buffer);
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
        const X = ox + i + .5, Y = oy + j + .5, lx = X * c + Y * s, ly = (-X * s + Y * c) * sg, u = Math.floor((lx - x0) * 8), v = Math.floor((ly - y0) * 8);
        if (u < 0 || v < 0 || u >= U.W || v >= U.H) continue;
        const px = U.s[v * U.W + u];
        if (px) D32[j * w + i] = px;
      }
    } else for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const X = ox + i + .5, Y = oy + j + .5, lx = X * c + Y * s, ly = (-X * s + Y * c) * sg, u = Math.floor(lx - x0), v = Math.floor(ly - y0);
      if (u < 0 || v < 0 || u >= W || v >= H) continue;
      const si = (v * W + u) * 4;
      if (!src[si + 3]) continue;
      const di = (j * w + i) * 4;
      D[di] = src[si];
      D[di + 1] = src[si + 1];
      D[di + 2] = src[si + 2];
      D[di + 3] = src[si + 3];
    }
    g.putImageData(id, 0, 0);
    q = {
      c: out,
      ox,
      oy
    };
    out.__rot = {
      ox,
      oy,
      ang: a,
      sg
    };
    M.set(key, q);
    if (M.size > S * 4) M.delete(M.keys().next().value);
    return q;
  };
  if (SX.audio && SX.audio.addSounds) SX.audio.addSounds({
    bank: {
      meleeHeavy: [ [ "swing_2", .84, 1 ], [ "swing_1", .86, .85 ] ],
      meleeLight: [ [ "gym_swish", .88, 1 ], [ "gym_swish", .95, 1 ] ],
      meleeStab: [ [ "gym_swish", 1.12, 1 ], [ "gym_swish", 1.05, 1 ] ]
    },
    gain: {
      meleeHeavy: .78,
      meleeLight: .62,
      meleeStab: .5
    }
  });
})(window.SX);
