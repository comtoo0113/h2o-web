"use strict";

(function(SX) {
  const MO = SX.motion = {
    on: true,
    tnow: null
  };
  const ART = SX.art;
  MO.ARM = {
    me: .1,
    peer: .15,
    other: .17
  };
  MO.BODY = {
    me: .2,
    other: .24
  };
  MO.CROUCH = {
    me: .1,
    other: .14
  };
  MO.SQ = {
    me: .12,
    other: .16
  };
  const ease = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
  const isMe = a => !!(SX.actors && a === SX.actors.player);
  const pick = (a, T) => isMe(a) ? T.me : a.kind === "peer" ? T.peer || T.other : T.other;
  const ZERO = [ 0, 0 ];
  function stOf(a) {
    let s = a._mo;
    if (s) return s;
    s = a._mo = {
      now: -1,
      P: null,
      P0: null,
      bt0: -1,
      bD: .2,
      act: false,
      wx: 0,
      wy: 0,
      fl: null,
      ox: 0,
      oy: 0,
      ox0: 0,
      oy0: 0,
      oT0: -1,
      oD: .2,
      vnow: -1,
      vP: null,
      vC: false,
      vb: 0,
      vb0: 0,
      vbT0: -1,
      vbD: .1,
      vs: 0,
      vs0: 0,
      vsT0: -1,
      vsD: .12,
      vsIn: 0,
      anow: -1,
      am: null,
      aw: null,
      ar: false,
      ak: "",
      t0: -1,
      dur: .1,
      armOn: false,
      offT0: -1,
      tg: [ 0, 0, 0, 0 ],
      d: [ 0, 0, 0, 0 ],
      f: [ 0, 0, 0, 0 ],
      fe: [ 0, 0, 0, 0 ],
      dS: [ 0, 0, 0, 0 ],
      dE: [ NaN, NaN, NaN, NaN ],
      dO: [ 0, 0, .9 ],
      dL: [ 6, 6 ],
      hw: [ 0, 0, 0, 0 ],
      R: {
        ox: 0,
        oy: 0,
        pose: null,
        k: 0,
        base: 0,
        sqd: 0
      },
      sh: [ 0, 0 ]
    };
    return s;
  }
  const SITS = {
    sit: 1,
    benchSit: 1,
    ride: 1
  };
  const S_DOWN = [ [ .3, "walk", 2 ], [ .6, "walk", 4 ] ];
  const S_UP = [ [ .4, "walk", 4 ], [ .7, "walk", 2 ] ];
  const S_LIE = [ [ .3, "walk", 3 ], [ .62, "benchSit", 0 ] ];
  const S_UNLIE = [ [ .38, "benchSit", 0 ], [ .7, "walk", 3 ] ];
  const S_FALL = [ [ .35, "walk", 3 ], [ .7, "sit", 0 ] ];
  const S_RISE = [ [ .35, "sit", 0 ], [ .7, "walk", 3 ] ];
  function seqOf(P0, P1) {
    if (!P0 || P0 === P1) return null;
    if (P1 === "down") return P0 === "walk" || SITS[P0] ? S_FALL : null;
    if (P0 === "down") return P1 === "walk" ? S_RISE : null;
    if (P0 === "walk") return SITS[P1] ? S_DOWN : P1 === "lie" ? S_LIE : null;
    if (P1 === "walk") return SITS[P0] ? S_UP : P0 === "lie" ? S_UNLIE : null;
    return null;
  }
  const postureOf = a => a.down && a.spec && (a.kind === "player" || a.kind === "peer") ? "down" : a.crawler ? "crawl" : a.reviving != null ? "sit" : a.bodyPose || "walk";
  function bodyDur(a, P0, P1) {
    const b = pick(a, MO.BODY);
    return P0 === "down" || P1 === "down" ? b + .12 : P0 === "lie" || P1 === "lie" ? b + .06 : b;
  }
  MO.seqOf = seqOf;
  MO.pre = function(a, now) {
    if (!MO.on || !a) return null;
    now = MO.clock();
    const s = stOf(a), R = s.R;
    if (s.now === now) return R;
    const dt = now - s.now, stale = s.now < 0 || dt > .3 || dt < 0;
    s.now = now;
    const TS = SX.TS, P = postureOf(a), wx = a.x * TS, wy = a.y * TS, act = !!a.armPose, fl = a.floor;
    if (stale || fl !== s.fl) {
      s.P = P;
      s.P0 = null;
      s.bt0 = -1;
      s.oT0 = -1;
      s.ox = s.oy = 0;
    } else {
      const chP = P !== s.P, chA = act !== s.act;
      if (chP) {
        s.P0 = s.P;
        s.P = P;
        s.bt0 = now;
        s.bD = bodyDur(a, s.P0, P);
      }
      if (chP || chA) {
        const jx = s.wx - wx, jy = s.wy - wy, j = Math.hypot(jx, jy);
        if (j > 2.5 && j < 160) {
          s.ox0 = s.ox + jx;
          s.oy0 = s.oy + jy;
          s.oT0 = now;
          s.oD = chP ? s.bD : pick(a, MO.BODY) * .8;
        }
      }
    }
    s.act = act;
    s.wx = wx;
    s.wy = wy;
    s.fl = fl;
    if (s.oT0 >= 0) {
      const e = ease((now - s.oT0) / s.oD);
      if (e >= 1) {
        s.oT0 = -1;
        s.ox = s.oy = 0;
      } else {
        s.ox = s.ox0 * (1 - e);
        s.oy = s.oy0 * (1 - e);
      }
    }
    R.ox = Math.round(s.ox);
    R.oy = Math.round(s.oy);
    R.pose = null;
    R.k = 0;
    if (s.bt0 >= 0) {
      const t = (now - s.bt0) / s.bD;
      if (t >= 1) s.bt0 = -1; else {
        const q = seqOf(s.P0, s.P);
        if (q) for (let i = 0; i < q.length; i++) if (t < q[i][0]) {
          R.pose = q[i][1];
          R.k = q[i][2];
          break;
        }
      }
    }
    return R;
  };
  MO.vert = function(a, now, base, sqd) {
    const s = a._mo, R = s && s.R;
    if (!R) return null;
    now = MO.clock();
    if (s.vnow !== now) {
      const dt = now - s.vnow, stale = s.vnow < 0 || dt > .3 || dt < 0, cr = !!a.crouch;
      if (stale) {
        s.vbT0 = -1;
        s.vsT0 = -1;
        s.vb = base;
        s.vs = sqd;
      } else {
        if ((s.P !== s.vP || cr !== s.vC) && Math.abs(base - s.vb) >= .5) {
          s.vb0 = s.vb;
          s.vbT0 = now;
          s.vbD = s.P !== s.vP ? s.bD : pick(a, MO.CROUCH);
        }
        if (Math.abs(sqd - s.vsIn) >= 3) {
          s.vs0 = s.vs;
          s.vsT0 = now;
          s.vsD = pick(a, MO.SQ);
        }
      }
      s.vP = s.P;
      s.vC = cr;
      s.vsIn = sqd;
      let b = base;
      if (s.vbT0 >= 0) {
        const e = ease((now - s.vbT0) / s.vbD);
        if (e >= 1) s.vbT0 = -1; else b = s.vb0 + (base - s.vb0) * e;
      }
      let q = sqd;
      if (s.vsT0 >= 0) {
        const e = ease((now - s.vsT0) / s.vsD);
        if (e >= 1) s.vsT0 = -1; else q = s.vs0 + (sqd - s.vs0) * e;
      }
      s.vb = b;
      s.vs = q;
      s.vnow = now;
      R.base = Math.round(b);
      R.sqd = Math.max(Math.round(q), R.k);
      s.sh[0] = R.ox;
      s.sh[1] = R.oy + (R.base - Math.round(base));
      s.yk = R.sqd + Math.round(base);
    }
    return R;
  };
  const DROP = [ null, [ 33 ], [ 32, 35 ], [ 31, 33, 35 ], [ 31, 32, 34, 35 ], [ 31, 32, 33, 35, 36 ] ];
  const bentC = ART.keyMap ? ART.keyMap(new Map, "bent:") : new Map;
  MO.bent = function(spec, dir, k, na) {
    k = Math.max(1, Math.min(5, k | 0));
    dir = dir & 3;
    const key = (spec.key || JSON.stringify(spec)) + ":" + dir + ":" + k + ":" + (na ? 1 : 0);
    let c = bentC.get(key);
    if (c) return c;
    if (dir === 3) c = ART.flipX(MO.bent(spec, 1, k, na)); else {
      const W = ART.CHAR_W, H = ART.CHAR_H, raw = ART.charRaw(spec, dir, 0, na ? "walk-na" : "walk"), sd = raw.getContext("2d").getImageData(0, 0, W, H).data, drop = DROP[k];
      c = ART.mk(W, H);
      const x = c.getContext("2d"), out = x.createImageData(W, H), od = out.data;
      for (let y = H - 1, ty = H - 1; y >= 0; y--) {
        if (drop.indexOf(y) >= 0) continue;
        od.set(sd.subarray(y * W * 4, (y + 1) * W * 4), ty * W * 4);
        ty--;
      }
      x.putImageData(out, 0, 0);
      ART.outline(c, ART.charLine(spec));
    }
    bentC.set(key, c);
    if (bentC.size > 600) bentC.delete(bentC.keys().next().value);
    return c;
  };
  MO.hang = function(a, now, on) {
    if (!MO.on || !a) return false;
    now = MO.clock();
    const s = stOf(a);
    if (on) {
      s.armOn = true;
      s.offT0 = -1;
      return false;
    }
    if (s.armOn) {
      s.armOn = false;
      s.offT0 = s.anow >= 0 && now - s.anow < .3 ? now : -1;
    }
    if (s.offT0 >= 0 && now - s.offT0 < pick(a, MO.ARM) + .04) return true;
    s.offT0 = -1;
    if (s.anow !== now) {
      s.am = null;
      s.anow = now;
    }
    return false;
  };
  MO.arms = function(a, now, hands, mode, w, tpH, rx, ry, hang, outN, outF, outW, cam) {
    if (!MO.on || !hands || !hands.S) return;
    now = MO.clock();
    const s = stOf(a), PO = SX.pose, H = hands, n = H.n, f = H.f;
    const tnx = n[0] - rx, tny = n[1] - ry, tfx = f[0] - rx, tfy = f[1] - ry;
    const lowN = H.supp === "n" ? PO.SUPPORT : PO.LOW, lowF = H.supp === "f" ? PO.SUPPORT : PO.LOW;
    const first = s.anow !== now;
    if (first) {
      const dt = now - s.anow, stale = s.anow < 0 || dt > .3 || dt < 0;
      const wn = w ? w.name || w : null, rl = !!a.reload, tag = mode !== "pose" ? "" : tpH ? "tp" : a.armPose ? "ap" : a.keyT > 0 ? "key" : a.typeT > 0 ? "ty" : a.reviving != null ? "rv" : "nv";
      let go = false;
      if (!stale) {
        if (mode !== s.am || wn !== s.aw || rl !== s.ar || tag !== s.ak) go = true; else if (mode === "pose" && a.bodyPose !== "run") {
          const J = 3 + 120 * dt, g = s.tg;
          if (Math.hypot(tnx - g[0], tny - g[1]) > J || Math.hypot(tfx - g[2], tfy - g[3]) > J) go = true;
        }
      }
      if (go) {
        const F = s.f, E = s.fe, SN = H.S.n, SF = H.S.f;
        if (!s.am) {
          const hn = hang("n"), hf = hang("f");
          F[0] = hn[0] - rx;
          F[1] = hn[1] - ry;
          F[2] = hf[0] - rx;
          F[3] = hf[1] - ry;
          const en = hn.length > 3 ? [ hn[2] - rx, hn[3] - ry ] : PO.elbow(SN[0] - rx, SN[1] - ry, F[0], F[1], outN, outW, PO.LOW), ef = hf.length > 3 ? [ hf[2] - rx, hf[3] - ry ] : PO.elbow(SF[0] - rx, SF[1] - ry, F[2], F[3], outF, outW, PO.LOW);
          E[0] = en[0];
          E[1] = en[1];
          E[2] = ef[0];
          E[3] = ef[1];
        } else {
          const D = s.d, DS = s.dS;
          F[0] = D[0];
          F[1] = D[1];
          F[2] = D[2];
          F[3] = D[3];
          for (let k = 0; k < 2; k++) {
            const ex = s.dE[k * 2];
            if (ex === ex) {
              E[k * 2] = ex;
              E[k * 2 + 1] = s.dE[k * 2 + 1];
            } else {
              const e = PO.elbow(DS[k * 2], DS[k * 2 + 1], D[k * 2], D[k * 2 + 1], s.dO[k], s.dO[2], s.dL[k]);
              E[k * 2] = e[0];
              E[k * 2 + 1] = e[1];
            }
          }
        }
        if (mode === "fists" && a.swing > 0) {
          const i = (a.punchN | 0) % 2 ? 2 : 0;
          F[i] = i ? tfx : tnx;
          F[i + 1] = i ? tfy : tny;
          const e = PO.elbow((i ? SF : SN)[0] - rx, (i ? SF : SN)[1] - ry, F[i], F[i + 1], i ? outF : outN, outW, PO.LOW);
          E[i] = e[0];
          E[i + 1] = e[1];
        }
        s.t0 = now;
        s.dur = pick(a, MO.ARM);
      } else if (stale) s.t0 = -1;
      s.am = mode;
      s.aw = wn;
      s.ar = rl;
      s.ak = tag;
      s.anow = now;
      const g = s.tg;
      g[0] = tnx;
      g[1] = tny;
      g[2] = tfx;
      g[3] = tfy;
    }
    let e = 1;
    if (s.t0 >= 0) {
      e = ease((now - s.t0) / s.dur);
      if (e >= 1) {
        e = 1;
        s.t0 = -1;
      }
    }
    if (e < 1) {
      const F = s.f, E = s.fe, u = 1 - e, SN = H.S.n, SF = H.S.f, HE = H.E;
      const tn = HE && HE.n ? [ HE.n[0] - rx, HE.n[1] - ry ] : PO.elbow(SN[0] - rx, SN[1] - ry, tnx, tny, outN, outW, lowN);
      const tf = HE && HE.f ? [ HE.f[0] - rx, HE.f[1] - ry ] : PO.elbow(SF[0] - rx, SF[1] - ry, tfx, tfy, outF, outW, lowF);
      n[0] = rx + F[0] * u + tnx * e;
      n[1] = ry + F[1] * u + tny * e;
      f[0] = rx + F[2] * u + tfx * e;
      f[1] = ry + F[3] * u + tfy * e;
      H.E = {
        n: [ rx + E[0] * u + tn[0] * e, ry + E[1] * u + tn[1] * e ],
        f: [ rx + E[2] * u + tf[0] * e, ry + E[3] * u + tf[1] * e ]
      };
    }
    if (first) {
      const D = s.d, HE = H.E, DS = s.dS, DE = s.dE;
      D[0] = n[0] - rx;
      D[1] = n[1] - ry;
      D[2] = f[0] - rx;
      D[3] = f[1] - ry;
      DE[0] = HE && HE.n ? HE.n[0] - rx : NaN;
      DE[1] = HE && HE.n ? HE.n[1] - ry : NaN;
      DE[2] = HE && HE.f ? HE.f[0] - rx : NaN;
      DE[3] = HE && HE.f ? HE.f[1] - ry : NaN;
      DS[0] = H.S.n[0] - rx;
      DS[1] = H.S.n[1] - ry;
      DS[2] = H.S.f[0] - rx;
      DS[3] = H.S.f[1] - ry;
      s.dO[0] = outN;
      s.dO[1] = outF;
      s.dO[2] = outW;
      s.dL[0] = lowN;
      s.dL[1] = lowF;
      if (cam) {
        s.hw[0] = n[0] + cam.x;
        s.hw[1] = n[1] + cam.y;
        s.hw[2] = f[0] + cam.x;
        s.hw[3] = f[1] + cam.y;
      }
    }
  };
  MO.blending = a => {
    const s = a && a._mo;
    return !!(s && s.t0 >= 0);
  };
  MO.WALK = {
    amp: .42,
    run: 1.4,
    len: 11,
    deep: .3
  };
  MO.walking = function(a) {
    if (!MO.on || !a) return false;
    const s = stOf(a), now = MO.clock(), wt = a.walkT;
    if (typeof wt === "number" && wt !== s.wt) {
      if (s.wt !== undefined && wt !== 0) s.wtAt = now;
      s.wt = wt;
    }
    return !!a.moving || s.wtAt != null && now - s.wtAt < .12;
  };
  MO.walkHands = function(a, fr, S, px, sideV, dir, dg, tv, still) {
    let sw = 0;
    if (!still) {
      const wt = a.legT != null ? a.legT : a.walkT, f4 = fr & 3, ph = typeof wt === "number" && isFinite(wt) && (Math.floor(wt) % 4 + 4) % 4 === f4 ? (wt % 4 + 4) % 4 : f4 + .5;
      sw = Math.sin((Math.round(ph * 2) / 2 - .5) * Math.PI / 2);
    }
    const k = a.sprinting ? MO.WALK.run : 1, Lr = MO.WALK.len;
    const va = tv >= 0 ? (tv % 360 + 360) % 360 : dg >= 0 && SX.turn && SX.turn.vaQ ? SX.turn.vaQ(dg) : (dir & 3) * 90, th = va * Math.PI / 180, sn = Math.sin(th), cs = Math.cos(th);
    const sideArt = tv >= 0 ? va === 90 || va === 180 || va === 270 : dg < 0 && sideV;
    const out = {
      E: {},
      S: {}
    }, wide = Math.max(0, Math.min(1, (Math.abs(cs) - .7) / .25));
    for (const key of [ "n", "f" ]) {
      const s0 = S[key], sk = (key === "n" !== sideArt ? 1 : -1) * sw, ph = MO.WALK.amp * k * sk, oS = Math.sign(s0[0] - px) || (key === "n" ? -1 : 1);
      const fw = Lr * Math.sin(ph), dn = Lr * Math.cos(ph), hx = s0[0] + sn * fw + oS * Math.abs(cs), hy = s0[1] + cs * fw * MO.WALK.deep + dn;
      const sx = s0[0] + Math.round((oS < 0 ? 2 : 1) * wide) * oS;
      out[key] = [ hx, hy ];
      out.S[key] = [ sx, s0[1] ];
      out.E[key] = [ sx + (hx - sx) * .5 - sn * .6, s0[1] + (hy - s0[1]) * .5 ];
    }
    return out;
  };
  MO.PRESS_D = .36;
  const SWZ = {
    fan: 3,
    tv: 14
  };
  MO.clock = () => MO.tnow != null ? MO.tnow : SX.view && SX.view.gt != null ? SX.view.gt / (SX.PACE || 1) : performance.now() / 1e3;
  MO.press = function(a, prop, role) {
    if (!a || !prop) return;
    const x = Math.max(prop.x + .15, Math.min(prop.x + prop.w - .15, a.x)), y = prop.y + prop.h - .05, z = SWZ[prop.kind] != null ? SWZ[prop.kind] : role === "tv" ? 14 : 16;
    a.press = {
      t0: MO.clock(),
      x,
      y,
      z
    };
    a.pressN = ((a.pressN | 0) + 1) % 1e6;
  };
  const pressU = (a, now) => {
    const q = a && a.press;
    if (!q) return -1;
    now = MO.clock();
    return (now - q.t0) / MO.PRESS_D;
  };
  MO.pressing = (a, now) => {
    if (!MO.on) return false;
    const u = pressU(a, now);
    return u >= 0 && u < 1;
  };
  MO.pressHands = function(a, now, hands, cam, outN, outF, outW, mode) {
    if (!MO.on || !hands || !hands.S || !cam) return;
    const u = pressU(a, now);
    if (u < 0 || u >= 1) {
      if (u >= 1) a.press = null;
      return;
    }
    const b = u < .42 ? ease(u / .42) : u < .58 ? 1 : ease((1 - u) / .42);
    if (!(b > 0)) return;
    const q = a.press, PO = SX.pose, TS = SX.TS, tx = q.x * TS - cam.x, ty = q.y * TS - cam.y - q.z, SN = hands.S.n, SF = hands.S.f;
    const k = mode === "hold" ? hands.supp || "f" : Math.hypot(SN[0] - tx, SN[1] - ty) <= Math.hypot(SF[0] - tx, SF[1] - ty) ? "n" : "f";
    const S = hands.S[k], px = a.x * TS - cam.x, py = a.y * TS - cam.y;
    let dx = tx - S[0], dy = ty - S[1], d = Math.hypot(dx, dy);
    if (d < 8) {
      dx = tx - px;
      dy = ty - (py - 12);
      const d2 = Math.hypot(dx, dy);
      if (d2 < 1) {
        dx = 0;
        dy = -1;
        d = 9;
      } else {
        d = Math.max(d, 9);
        dx /= d2;
        dy /= d2;
      }
    } else {
      dx /= d;
      dy /= d;
    }
    const r = Math.max(8, Math.min(d, 11)), hx = S[0] + dx * r, hy = S[1] + dy * r, h = hands[k];
    h[0] += (hx - h[0]) * b;
    h[1] += (hy - h[1]) * b;
    if (hands.E && hands.E[k]) {
      const e = PO.elbow(S[0], S[1], h[0], h[1], k === "n" ? outN : outF, outW, hands.supp === k ? PO.SUPPORT : PO.LOW), E = hands.E[k];
      hands.E[k] = [ E[0] + (e[0] - E[0]) * b, E[1] + (e[1] - E[1]) * b ];
    }
    hands.press = k;
  };
  MO.pressAng = function(a, now, w) {
    if (!MO.on) return w;
    if (a.muzzleT > 0 || a.aimHeld || a.reload) {
      a.press = null;
      return w;
    }
    const u = pressU(a, now);
    if (u < 0 || u >= 1) return w;
    const b = u < .42 ? ease(u / .42) : u < .58 ? 1 : ease((1 - u) / .42), d = Math.atan2(Math.sin(Math.PI / 2 - w), Math.cos(Math.PI / 2 - w));
    return w + Math.max(-.95, Math.min(.95, d)) * b;
  };
  MO.netPr = a => {
    const q = a && a.press;
    return q && MO.clock() - q.t0 < 2 ? [ a.pressN | 0, Math.round(q.x * 100) / 100, Math.round(q.y * 100) / 100, q.z | 0 ] : null;
  };
  MO.netPrIn = function(g, pr, snap) {
    if (!g || !Array.isArray(pr) || pr.length < 4) return;
    const n = pr[0] | 0;
    if (n === g.pressN) return;
    const fresh0 = g.pressN === undefined && snap;
    g.pressN = n;
    if (fresh0) return;
    g.press = {
      t0: MO.clock(),
      x: +pr[1] || 0,
      y: +pr[2] || 0,
      z: +pr[3] || 0
    };
  };
  const fresh = t => t >= 0 && MO.clock() - t < .1;
  MO.shift = function(a) {
    const s = a && a._mo;
    return s && MO.on && fresh(s.vnow) ? s.sh : ZERO;
  };
  MO.handAt = function(a, k, cam) {
    const s = a && a._mo;
    if (!s || !MO.on || !fresh(s.anow) || !cam) return null;
    if (s.t0 < 0 && !(fresh(s.vnow) && (s.sh[0] || s.sh[1]))) return null;
    const i = k === "f" ? 2 : 0;
    return [ s.hw[i] - cam.x, s.hw[i + 1] - cam.y ];
  };
  MO.poseRel = function(a) {
    const s = a && a._mo;
    if (!s || !MO.on || !fresh(s.anow) || s.t0 < 0) return null;
    const d = s.d, y = s.yk || 0;
    return {
      n: [ d[0], d[1] + y ],
      f: [ d[2], d[3] + y ]
    };
  };
})(window.SX);
