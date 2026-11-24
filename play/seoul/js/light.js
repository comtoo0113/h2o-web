"use strict";

(function(SX) {
  const TS = SX.TS, T = SX.map.T;
  const L = SX.light = {
    vis: null,
    visF: null,
    box: null,
    cells: null,
    dyn: [],
    polys: []
  };
  const HALF = TS / 2;
  const sprBB = new WeakMap;
  function spriteBB(c) {
    let b = sprBB.get(c);
    if (b !== undefined) return b;
    const w = c.width, h = c.height, d = c.getContext("2d").getImageData(0, 0, w, h).data;
    let x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] >= 200) {
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
    b = x1 < 0 ? null : [ x0, y0, x1 + 1, y1 + 1 ];
    sprBB.set(c, b);
    return b;
  }
  L.propGeo = function(p) {
    const X = p.px != null ? p.px : p.x, Y = p.py != null ? p.py : p.y, g0 = p._vg;
    if (g0 && g0.X === X && g0.Y === Y && g0.r === p.rot && g0.v === p.v && g0.k === p.kind) return g0;
    let bx0 = X, by0 = Y, bx1 = X + p.w, by1 = Y + p.h, sy0 = Y, sy1 = Y + p.h;
    const sp = SX.art.prop(p.kind, p.v, p.col, p.rot), b = sp && spriteBB(sp.c);
    if (b) {
      bx0 = X + b[0] / TS;
      bx1 = X + b[2] / TS;
      by0 = Y + (sp.oy + b[1]) / TS;
      by1 = Y + (sp.oy + b[3]) / TS;
    }
    const wk = p.hit && p.hit.walk;
    if (wk && wk.length) {
      sy0 = 1e9;
      sy1 = -1e9;
      for (const r of wk) {
        if (r.y0 < sy0) sy0 = r.y0;
        if (r.y1 > sy1) sy1 = r.y1;
      }
    }
    if (sy1 > by1) by1 = sy1;
    return p._vg = {
      X,
      Y,
      r: p.rot,
      v: p.v,
      k: p.kind,
      bx0,
      by0,
      bx1,
      by1,
      sy0,
      sy1
    };
  };
  function occBox(p, ox, oy, fy, out) {
    const g = L.propGeo(p);
    const x0 = g.bx0, x1 = g.bx1, inX = ox > x0 && ox < x1;
    let y0, y1 = g.by1;
    if (fy >= g.sy0 + .02) {
      y0 = g.by0;
      if (inX && oy > y0 && oy < y1) y1 = oy;
    } else {
      y0 = g.sy0;
      if (inX && oy > y0 && oy < y1) y0 = oy;
    }
    if (y1 - y0 > .01 && x1 - x0 > .01) out.push(x0, y0, x1, y1);
  }
  const occOK = p => p.tall && !p.hidden && !p.lift;
  function occluders(F, ox, oy, R, fy) {
    const out = [];
    if (F.noPropOcc) return out;
    for (const p of F.props) {
      if (!occOK(p) || p.x > ox + R + 1 || p.x + p.w < ox - R - 1 || p.y > oy + R + 3 || p.y + p.h < oy - R - 1) continue;
      occBox(p, ox, oy, fy, out);
    }
    return out;
  }
  const SL = new Float64Array(2);
  function slab(B, j, ox, oy, ux, uy) {
    const x0 = B[j], y0 = B[j + 1], x1 = B[j + 2], y1 = B[j + 3];
    let t0 = 0, t1 = 1e9;
    if (ux > 1e-12 || ux < -1e-12) {
      let a = (x0 - ox) / ux, c = (x1 - ox) / ux;
      if (a > c) {
        const t = a;
        a = c;
        c = t;
      }
      if (a > t0) t0 = a;
      if (c < t1) t1 = c;
    } else if (ox <= x0 || ox >= x1) return false;
    if (uy > 1e-12 || uy < -1e-12) {
      let a = (y0 - oy) / uy, c = (y1 - oy) / uy;
      if (a > c) {
        const t = a;
        a = c;
        c = t;
      }
      if (a > t0) t0 = a;
      if (c < t1) t1 = c;
    } else if (oy <= y0 || oy >= y1) return false;
    if (t1 - t0 <= 1e-7) return false;
    SL[0] = t0;
    SL[1] = t1;
    return true;
  }
  const TAU = Math.PI * 2, EPS = 1e-4;
  const nrm = a => {
    a %= TAU;
    return a < 0 ? a + TAU : a;
  };
  L.computeVis = function(F, ox, oy, R, add, fy) {
    if (L.visF !== F || !L.vis || L.vis.length !== F.W * F.H) {
      L.vis = new Uint8Array(F.W * F.H);
      L.sv = new Uint8Array(F.W * F.H);
      L.gv = new Uint8Array(F.W * F.H);
      L.dv = new Uint8Array(F.W * F.H);
      L.visF = F;
      L.box = null;
      L.polys = [];
      L.occ = [];
      L.quads = [];
      L.glass = [];
    }
    const vis = L.vis, sv = L.sv, gv = L.gv, dv = L.dv;
    if (L.box && !add) {
      const b = L.box;
      for (let y = b.y0; y <= b.y1; y++) {
        const a = y * F.W + b.x0, e = y * F.W + b.x1 + 1;
        vis.fill(0, a, e);
        sv.fill(0, a, e);
        gv.fill(0, a, e);
        dv.fill(0, a, e);
      }
    }
    if (!add || !L.polys) {
      L.polys = [];
      L.occ = [];
      L.quads = [];
      L.glass = [];
    }
    const x0 = Math.max(0, Math.floor(ox - R)), x1 = Math.min(F.W - 1, Math.floor(ox + R)), y0 = Math.max(0, Math.floor(oy - R)), y1 = Math.min(F.H - 1, Math.floor(oy + R));
    L.box = add && L.box ? {
      x0: Math.min(L.box.x0, x0),
      x1: Math.max(L.box.x1, x1),
      y0: Math.min(L.box.y0, y0),
      y1: Math.max(L.box.y1, y1)
    } : {
      x0,
      x1,
      y0,
      y1
    };
    const otx = Math.floor(ox), oty = Math.floor(oy);
    const n = Math.ceil(R * 8);
    const SM = SX.tac && SX.tac.smokes ? SX.tac.smokes(F) : null, SMD = SM ? SX.tac.SMOKE_DEPTH : 0;
    const B = occluders(F, ox, oy, R, fy == null ? oy + .4 : fy), nb = B.length, nq = nb / 4;
    const A0 = new Float64Array(nq), SP = new Float64Array(nq), HIT = new Uint8Array(nq);
    for (let j = 0; j < nb; j += 4) {
      const ac = Math.atan2((B[j + 1] + B[j + 3]) / 2 - oy, (B[j] + B[j + 2]) / 2 - ox);
      let lo = 0, hi = 0;
      for (let c = 0; c < 4; c++) {
        const cx = B[j + (c & 1 ? 2 : 0)], cy = B[j + (c & 2 ? 3 : 1)];
        if (Math.abs(cx - ox) + Math.abs(cy - oy) < 1e-6) continue;
        let d = Math.atan2(cy - oy, cx - ox) - ac;
        if (d > Math.PI) d -= TAU; else if (d < -Math.PI) d += TAU;
        if (d < lo) lo = d;
        if (d > hi) hi = d;
      }
      A0[j / 4] = nrm(ac + lo);
      SP[j / 4] = hi - lo;
    }
    let VX = 0, VY = 0, VD = 0, VK = 0, VF = -1, VL = 0, VG = Infinity, PK = 0, PX = 0, PY = 0, PF = -1, PL = 0;
    const WH = new Map;
    const wallHit = (i, f, c) => {
      const k = i * 4 + f, m = WH.get(k);
      if (!m) WH.set(k, [ c, c ]); else {
        if (c < m[0]) m[0] = c;
        if (c > m[1]) m[1] = c;
      }
    };
    const cast = (a, lim) => {
      const ux = Math.cos(a), uy = Math.sin(a), Rm = lim == null ? R : Math.min(R, lim);
      VK = 0;
      VF = -1;
      VG = Infinity;
      PK = 0;
      let tE = Infinity, tX = 0, hj = -1;
      if (nb) {
        for (let j = 0; j < nb; j += 4) {
          let d = a - A0[j / 4];
          if (d < 0) d += TAU;
          if (d > SP[j / 4] + 1e-6) continue;
          if (slab(B, j, ox, oy, ux, uy) && SL[0] < tE) {
            tE = SL[0];
            tX = SL[1];
            hj = j / 4;
          }
        }
        if (tE < Infinity) for (let more = true, g = 0; more && g < 8; g++) {
          more = false;
          for (let j = 0; j < nb; j += 4) {
            let d = a - A0[j / 4];
            if (d < 0) d += TAU;
            if (d > SP[j / 4] + 1e-6) continue;
            if (slab(B, j, ox, oy, ux, uy) && SL[0] <= tX + 1e-6 && SL[1] > tX + 1e-6) {
              tX = SL[1];
              more = true;
            }
          }
        }
      }
      let tS = Infinity;
      if (SM) {
        const iv = [];
        for (const c of SM) {
          const qx = c.x - ox, qy = c.y - oy, tc = qx * ux + qy * uy, h2 = c.r2 - (qx * qx + qy * qy - tc * tc);
          if (h2 <= 0) continue;
          const h = Math.sqrt(h2), t0 = Math.max(0, tc - h), t1 = tc + h;
          if (t1 > t0) iv.push([ t0, t1 ]);
        }
        if (iv.length) {
          iv.sort((p, q) => p[0] - q[0]);
          let acc = 0, cs = iv[0][0], ce = iv[0][1];
          for (let k = 1; k <= iv.length; k++) {
            if (k < iv.length && iv[k][0] <= ce) {
              if (iv[k][1] > ce) ce = iv[k][1];
              continue;
            }
            if (acc + (ce - cs) > SMD) {
              tS = cs + (SMD - acc);
              break;
            }
            acc += ce - cs;
            if (k < iv.length) {
              cs = iv[k][0];
              ce = iv[k][1];
            }
          }
        }
      }
      const tStop = Math.min(tE, tS, Rm);
      let tx = otx, ty = oty;
      const sx = ux > 0 ? 1 : -1, sy = uy > 0 ? 1 : -1, tdx = ux > 1e-12 || ux < -1e-12 ? Math.abs(1 / ux) : Infinity, tdy = uy > 1e-12 || uy < -1e-12 ? Math.abs(1 / uy) : Infinity;
      let tmx = tdx < Infinity ? (ux > 0 ? tx + 1 - ox : ox - tx) * tdx : Infinity, tmy = tdy < Infinity ? (uy > 0 ? ty + 1 - oy : oy - ty) * tdy : Infinity;
      let t = 0;
      for (let g = 0; g < 400; g++) {
        const tn = tmx < tmy ? tmx : tmy;
        if (tn >= tStop) {
          if (tStop === tE) {
            const tt = Math.min(tX, R);
            for (let u = tE; u < tt; u += .25) {
              const qx = Math.floor(ox + ux * u), qy = Math.floor(oy + uy * u);
              if (qx >= x0 && qy >= y0 && qx <= x1 && qy <= y1) vis[qy * F.W + qx] = 1;
            }
            t = tt;
            HIT[hj] = 1;
            VK = 2;
          } else t = tStop;
          break;
        }
        let f;
        if (tmx < tmy) {
          tx += sx;
          t = tmx;
          tmx += tdx;
          f = ux > 0 ? 2 : 3;
        } else {
          ty += sy;
          t = tmy;
          tmy += tdy;
          f = uy > 0 ? 1 : 0;
        }
        if (tx < x0 || ty < y0 || tx > x1 || ty > y1) break;
        const i = ty * F.W + tx;
        vis[i] = 1;
        if (F.t[i] === T.WINDOW && VG === Infinity && !F.opaqueTile(tx, ty)) {
          VG = t;
          dv[i] = 1;
          const ex = ox + ux * t, ey = oy + uy * t;
          wallHit(i, f, f < 2 ? Math.min(tx + 1, Math.max(tx, ex)) : Math.min(ty + 1, Math.max(ty, ey)));
          if (!PK) {
            PK = 1;
            PF = f;
            PL = f === 0 ? ty + 1 : f === 1 ? ty : f === 2 ? tx : tx + 1;
            PX = f < 2 ? ex : PL;
            PY = f < 2 ? PL : ey;
          }
        } else if (VG < Infinity) gv[i] = 1; else dv[i] = 1;
        if (F.opaqueTile(tx, ty)) {
          if (ty > 0) vis[i - F.W] = 1;
          const ex = ox + ux * t, ey = oy + uy * t;
          if (f < 2) {
            VL = f === 0 ? ty + 1 : ty;
            wallHit(i, f, Math.min(tx + 1, Math.max(tx, ex)));
            VX = ex;
            VY = VL;
          } else {
            VL = f === 2 ? tx : tx + 1;
            wallHit(i, f, Math.min(ty + 1, Math.max(ty, ey)));
            VX = VL;
            VY = ey;
          }
          VD = t;
          VK = 1;
          VF = f;
          if (!PK) {
            PK = 1;
            PF = f;
            PL = VL;
            PX = VX;
            PY = VY;
          }
          return;
        }
        sv[i] = 1;
      }
      VX = ox + ux * t;
      VY = oy + uy * t;
      VD = t;
    };
    const AN = [], XS = [], YS = [], DS = [], KS = [], FS = [], LS = [], GS = [], QK = [], QX = [], QY = [], QF = [], QL = [];
    const put = a => {
      AN.push(a);
      XS.push(VX);
      YS.push(VY);
      DS.push(VD);
      KS.push(VK);
      FS.push(VF);
      LS.push(VL);
      GS.push(VG);
      QK.push(PK);
      QX.push(PK ? PX : VX);
      QY.push(PK ? PY : VY);
      QF.push(PF);
      QL.push(PL);
    };
    for (let k = 0; k < n; k++) {
      const a = k / n * TAU;
      cast(a);
      put(a);
    }
    const step = TAU / n;
    const wallish = (x, y) => F.in(x, y) && (F.opaqueTile(x, y) || F.t[y * F.W + x] === T.WINDOW) && F.t[y * F.W + x] !== T.VOID;
    for (let q = 0; q < nq; q++) {
      if (!HIT[q] && SP[q] > step * 1.5) continue;
      const j = q * 4, lo = A0[q], hi = A0[q] + SP[q];
      const more = [ lo - EPS, lo + EPS, hi - EPS, hi + EPS ];
      for (let c = 0; c < 4; c++) {
        const cx = B[j + (c & 1 ? 2 : 0)], cy = B[j + (c & 2 ? 3 : 1)];
        if (Math.abs(cx - ox) + Math.abs(cy - oy) < 1e-6) continue;
        let d = nrm(Math.atan2(cy - oy, cx - ox)) - lo;
        if (d < 0) d += TAU;
        if (d > 1e-5 && d < SP[q] - 1e-5) more.push(lo + d);
      }
      for (let ly = Math.ceil(B[j + 1] + 1e-6); ly < B[j + 3] - 1e-6; ly++) for (const cx of [ B[j], B[j + 2] ]) {
        const tx = Math.floor(cx === B[j + 2] ? cx - 1e-6 : cx);
        if (wallish(tx, ly - 1) !== wallish(tx, ly)) {
          const a = Math.atan2(ly - oy, cx - ox);
          more.push(a - EPS, a + EPS);
        }
      }
      for (let lx = Math.ceil(B[j] + 1e-6); lx < B[j + 2] - 1e-6; lx++) for (const cy of [ B[j + 1], B[j + 3] ]) {
        const ty = Math.floor(cy === B[j + 3] ? cy - 1e-6 : cy);
        if (wallish(lx - 1, ty) !== wallish(lx, ty)) {
          const a = Math.atan2(cy - oy, lx - ox);
          more.push(a - EPS, a + EPS);
        }
      }
      for (const a0 of more) {
        const a = nrm(a0);
        cast(a);
        put(a);
      }
    }
    let ord = new Uint32Array(AN.length);
    for (let k = 0; k < ord.length; k++) ord[k] = k;
    ord.sort((p1, p2) => AN[p1] - AN[p2]);
    let SLf = -1, SLl = 0;
    const onLine = (oa, f, l) => f < 2 ? Math.abs(YS[oa] - l) < .05 : Math.abs(XS[oa] - l) < .05;
    const sameLine = (o1, o2) => {
      SLf = -1;
      if (KS[o1] !== 1 || KS[o2] !== 1) return false;
      if (FS[o1] === FS[o2] && LS[o1] === LS[o2]) {
        SLf = FS[o1];
        SLl = LS[o1];
        return true;
      }
      if (onLine(o1, FS[o2], LS[o2])) {
        SLf = FS[o2];
        SLl = LS[o2];
        return true;
      }
      if (onLine(o2, FS[o1], LS[o1])) {
        SLf = FS[o1];
        SLl = LS[o1];
        return true;
      }
      return false;
    };
    {
      const m1 = ord.length, gp = [];
      for (let k = 0; k < m1 && gp.length < 48; k++) {
        const o1 = ord[k], o2 = ord[(k + 1) % m1];
        if (!sameLine(o1, o2)) continue;
        const f = SLf, line = SLl, ca = f < 2 ? XS[o1] : YS[o1], cb = f < 2 ? XS[o2] : YS[o2], lo = Math.min(ca, cb), hi = Math.max(ca, cb);
        if (hi - lo < 1 || hi - lo > 2 * R) continue;
        for (let c = Math.floor(lo); c <= Math.floor(hi - 1e-9); c++) {
          const tx = f < 2 ? c : f === 2 ? line : line - 1, ty = f < 2 ? f === 0 ? line - 1 : line : c;
          if (wallish(tx, ty)) continue;
          for (const q of [ c + .03, c + .97 ]) {
            const px = f < 2 ? q : line, py = f < 2 ? line : q;
            gp.push(nrm(Math.atan2(py - oy, px - ox)));
          }
        }
      }
      for (let k = 0; k < m1 && gp.length < 96; k++) {
        const o1 = ord[k], o2 = ord[(k + 1) % m1];
        if (KS[o1] !== 1 || KS[o2] !== 1 || FS[o1] < 2 === FS[o2] < 2) continue;
        const cx = FS[o1] < 2 ? LS[o2] : LS[o1], cy = FS[o1] < 2 ? LS[o1] : LS[o2];
        if (Math.hypot(cx - ox, cy - oy) > R) continue;
        const ac = nrm(Math.atan2(cy - oy, cx - ox));
        let d1 = ac - AN[o1], d2 = AN[o2] - AN[o1];
        if (d1 < 0) d1 += TAU;
        if (d2 < 0) d2 += TAU;
        if (d1 > 1e-7 && d1 < d2 - 1e-7) gp.push(ac);
      }
      if (gp.length) {
        for (const a of gp) {
          cast(a);
          put(a);
        }
        ord = new Uint32Array(AN.length);
        for (let k = 0; k < ord.length; k++) ord[k] = k;
        ord.sort((p1, p2) => AN[p1] - AN[p2]);
      }
    }
    {
      const m0 = ord.length;
      for (let k = 0; k < m0; k++) {
        const o1 = ord[k], o2 = ord[(k + 1) % m0], d1 = DS[o1], d2 = DS[o2];
        if (Math.abs(d1 - d2) < .75) continue;
        const near1 = d1 < d2, on = near1 ? o1 : o2;
        if (KS[on] !== 1) continue;
        if (KS[o1] === 1 && KS[o2] === 1 && FS[o1] === FS[o2] && LS[o1] === LS[o2]) continue;
        let lo = AN[o1], hi = AN[o2];
        if (hi < lo) hi += TAU;
        if (hi - lo < 2e-4 || hi - lo > step * 1.5) continue;
        const mid = (d1 + d2) / 2, nf = FS[on], nl = LS[on], lim = Math.max(d1, d2) + .3;
        for (let it = 0; it < 7; it++) {
          const mm = (lo + hi) / 2;
          cast(nrm(mm), lim);
          if ((VD < mid || VK === 1 && VF === nf && VL === nl) === near1) lo = mm; else hi = mm;
        }
        cast(nrm(lo));
        put(nrm(lo));
        cast(nrm(hi));
        put(nrm(hi));
      }
      if (AN.length > m0) {
        ord = new Uint32Array(AN.length);
        for (let k = 0; k < ord.length; k++) ord[k] = k;
        ord.sort((p1, p2) => AN[p1] - AN[p2]);
      }
    }
    const m = ord.length, poly = new Float32Array(m * 2);
    for (let k = 0; k < m; k++) {
      poly[k * 2] = XS[ord[k]];
      poly[k * 2 + 1] = YS[ord[k]];
    }
    const SEG = new Map;
    const addSeg = (f, line, a, b) => {
      const k = f * 1e5 + line;
      let q = SEG.get(k);
      if (!q) SEG.set(k, q = []);
      q.push(a < b ? [ a, b ] : [ b, a ]);
    };
    for (const [key, mm] of WH) {
      const i = key / 4 | 0, f = key - i * 4, tx = i % F.W, ty = (i - tx) / F.W;
      if (F.t[i] === T.VOID) continue;
      addSeg(f, f === 0 ? ty + 1 : f === 1 ? ty : f === 2 ? tx : tx + 1, mm[0], mm[1]);
    }
    const onL = (o, f, l) => (QK[o] || KS[o] !== 2) && (f < 2 ? Math.abs(QY[o] - l) < .05 : Math.abs(QX[o] - l) < .05);
    for (let k = 0; k < m; k++) {
      const o1 = ord[k], o2 = ord[(k + 1) % m];
      let f = -1, line = 0;
      if (QK[o1] && onL(o2, QF[o1], QL[o1])) {
        f = QF[o1];
        line = QL[o1];
      } else if (QK[o2] && onL(o1, QF[o2], QL[o2])) {
        f = QF[o2];
        line = QL[o2];
      }
      if (f < 0) continue;
      const ca = f < 2 ? QX[o1] : QY[o1], cb = f < 2 ? QX[o2] : QY[o2], lo = Math.min(ca, cb), hi = Math.max(ca, cb);
      if (hi - lo > 2 * R) continue;
      let run = lo;
      for (let c = Math.floor(lo); c <= Math.floor(hi - 1e-9); c++) {
        const tx = f < 2 ? c : f === 2 ? line : line - 1, ty = f < 2 ? f === 0 ? line - 1 : line : c;
        if (!wallish(tx, ty)) {
          if (c > run) addSeg(f, line, run, c);
          run = c + 1;
        }
      }
      if (hi > run) addSeg(f, line, run, hi);
    }
    const fT = 1 - (F.wallH || 24) / TS;
    const Qs = [], Qt = [], Qf = [], CL = [];
    const goesOn = (f, line, c) => {
      if (f < 2) {
        const tx = Math.floor(c);
        return wallish(tx, f === 0 ? line - 1 : line) && !wallish(tx, f === 0 ? line : line - 1);
      }
      const ty = Math.floor(c);
      return wallish(f === 2 ? line : line - 1, ty) && !wallish(f === 2 ? line - 1 : line, ty);
    };
    for (const [k0, segs] of SEG) {
      const f = Math.floor(k0 / 1e5), line = k0 - f * 1e5;
      segs.sort((p, q) => p[0] - q[0]);
      const mg = [];
      for (const sg of segs) {
        const l = mg[mg.length - 1];
        if (l && sg[0] <= l[1] + .05) {
          if (sg[1] > l[1]) l[1] = sg[1];
        } else mg.push([ sg[0], sg[1] ]);
      }
      for (let [a, b] of mg) {
        if (a - Math.floor(a) < .12 && !goesOn(f, line, Math.floor(a) - .5)) a = Math.floor(a);
        if (Math.ceil(b) - b < .12 && !goesOn(f, line, Math.ceil(b) + .5)) b = Math.ceil(b);
        if (b - a < .04) continue;
        const fa = goesOn(f, line, a - .02) ? 1 : 0, fb = goesOn(f, line, b + .02) ? 1 : 0;
        Qf.push(f);
        CL.push([ f, line, a, b ]);
        if (f === 0) {
          const ty = line - 1;
          Qs.push(a, ty - .75, b, ty + 1.06, fa, fb, 0);
          Qt.push(a, ty + fT, b, ty + 1.06, fa, fb, 0);
        } else if (f === 1) {
          const ty = line;
          Qs.push(a, ty - .06, b, ty + 1, fa, fb, 0);
          Qt.push(a, ty - .06, b, ty + .25, fa, fb, 0);
        } else {
          const c0 = f === 2 ? line : line - 1, xa = f === 2 ? c0 - .06 : c0, xb = f === 2 ? c0 + 1 : c0 + 1.06;
          Qs.push(xa, a - .75, xb, b, fa, fb, 1);
          Qt.push(xa, a - .75, xb, b, fa, fb, 1);
        }
      }
    }
    if (F.kind === "hub" && CL.length) {
      const has = (f, line, c) => CL.some(q => q[0] === f && q[1] === line && c >= q[2] - .05 && c <= q[3] + .05), done = new Set;
      const put = (tx, ty, top) => {
        const k = ty * F.W + tx;
        if (done.has(k)) return;
        done.add(k);
        Qf.push(top ? 1 : 0);
        if (top) {
          Qs.push(tx, ty - .06, tx + 1, ty + 1, 0, 0, 0);
          Qt.push(tx, ty - .06, tx + 1, ty + .25, 0, 0, 0);
        } else {
          Qs.push(tx, ty - .75, tx + 1, ty + 1.06, 0, 0, 0);
          Qt.push(tx, ty + fT, tx + 1, ty + 1.06, 0, 0, 0);
        }
      };
      for (const [f, line, a, b] of CL) {
        if (f > 1) continue;
        const ty = f === 0 ? line - 1 : line, dy = f === 0 ? 1 : -1;
        for (const [cx, sf] of [ [ Math.floor(a + .05) - 1, 3 ], [ Math.ceil(b - .05), 2 ] ]) {
          if (!wallish(cx, ty) || !wallish(cx, ty + dy) || !has(sf, sf === 3 ? cx + 1 : cx, ty + dy + .5)) continue;
          put(cx, ty, f === 1);
        }
        if (f !== 0) continue;
        for (const [c0, st] of [ [ Math.floor(a + .05) - 1, -1 ], [ Math.ceil(b - .05), 1 ] ]) {
          for (let cx = c0, n = 0; n < 8 && F.in(cx, ty) && F.t[ty * F.W + cx] === T.DOOR; cx += st, 
          n++) {
            const dd = F.doorAt && F.doorAt.get(ty * F.W + cx);
            if (!dd || !dd.horiz) break;
            const k = -1 - (ty * F.W + cx);
            if (done.has(k)) continue;
            done.add(k);
            Qf.push(1);
            Qs.push(cx, ty - .75, cx + 1, ty - .46, 0, 0, 0);
            Qt.push(cx, ty - .75, cx + 1, ty - .46, 0, 0, 0);
          }
        }
      }
    }
    if (!L.quads) L.quads = [];
    L.quads.push({
      s: new Float32Array(Qs),
      t: new Float32Array(Qt),
      f: new Uint8Array(Qf)
    });
    const GQ = [];
    for (let k = 0; k < m; k++) {
      const o1 = ord[k], o2 = ord[(k + 1) % m];
      if (!(GS[o1] < Infinity) || !(GS[o2] < Infinity)) continue;
      let da = AN[o2] - AN[o1];
      if (da < 0) da += TAU;
      if (da > step * 1.5) continue;
      GQ.push(ox + Math.cos(AN[o1]) * GS[o1], oy + Math.sin(AN[o1]) * GS[o1], XS[o1], YS[o1], XS[o2], YS[o2], ox + Math.cos(AN[o2]) * GS[o2], oy + Math.sin(AN[o2]) * GS[o2]);
    }
    if (!L.glass) L.glass = [];
    if (GQ.length) L.glass.push(new Float32Array(GQ));
    vis[oty * F.W + otx] = 1;
    sv[oty * F.W + otx] = 1;
    dv[oty * F.W + otx] = 1;
    L.polys.push(poly);
    L.occ.push({
      x: ox,
      y: oy,
      b: B
    });
  };
  const eyeBlock = (F, x, y) => F.opaque(x, y) || F.in(x, y) && F.t[y * F.W + x] === T.WINDOW;
  L.eyeBlock = eyeBlock;
  const lineB = (F, x, y) => F.opaqueTile(x, y) || F.in(x, y) && F.t[y * F.W + x] === T.WINDOW;
  L.eyeY = function(F, x, fy) {
    const ey = fy - .4, tx = Math.floor(x), ty = Math.floor(ey);
    if (!eyeBlock(F, tx, ty)) {
      if (ty < Math.floor(fy)) for (let k = 1; k <= 3; k++) if (lineB(F, tx - k, ty) && !lineB(F, tx - k, ty + 1) || lineB(F, tx + k, ty) && !lineB(F, tx + k, ty + 1)) return ty + 1.02;
      return ey;
    }
    if (ey - ty < .5 && !eyeBlock(F, tx, ty - 1)) return ty - .02;
    return ty + 1.02;
  };
  L.seen = function(F, x, y) {
    if (L.visF !== F) return false;
    const tx = Math.floor(x), ty = Math.floor(y);
    return F.in(tx, ty) && L.vis[ty * F.W + tx] === 1;
  };
  function segHit(B, ax, ay, bx, by) {
    const ux = bx - ax, uy = by - ay;
    for (let j = 0; j < B.length; j += 4) {
      if (slab(B, j, ax, ay, ux, uy) && SL[0] < 1 - 1e-6) return true;
    }
    return false;
  }
  function segHitBut(B, ax, ay, bx, by, g) {
    const ux = bx - ax, uy = by - ay;
    for (let j = 0; j < B.length; j += 4) {
      if (Math.abs(B[j] - g.bx0) < 1e-6 && Math.abs(B[j + 2] - g.bx1) < 1e-6 && B[j + 1] < g.by1 + 1e-6 && B[j + 3] > g.sy0 - 1e-6) continue;
      if (slab(B, j, ax, ay, ux, uy) && SL[0] < 1 - 1e-6) return true;
    }
    return false;
  }
  function gridClear(F, ax, ay, bx, by) {
    let x = Math.floor(ax), y = Math.floor(ay);
    const gx = Math.floor(bx), gy = Math.floor(by), dx = bx - ax, dy = by - ay;
    const sx = dx > 0 ? 1 : -1, sy = dy > 0 ? 1 : -1, tdx = dx ? Math.abs(1 / dx) : Infinity, tdy = dy ? Math.abs(1 / dy) : Infinity;
    let tmx = dx ? (dx > 0 ? x + 1 - ax : ax - x) * tdx : Infinity, tmy = dy ? (dy > 0 ? y + 1 - ay : ay - y) * tdy : Infinity;
    for (let k = 0; k < 400 && (x !== gx || y !== gy); k++) {
      if (tmx < tmy) {
        x += sx;
        tmx += tdx;
      } else {
        y += sy;
        tmy += tdy;
      }
      if ((x !== gx || y !== gy) && F.opaqueTile(x, y)) return false;
    }
    return true;
  }
  const PB = [];
  L.propBlocked = function(F, ox, oy, fy, x, y) {
    if (!F || F.noPropOcc) return false;
    const minx = Math.min(ox, x) - 1, maxx = Math.max(ox, x) + 1, miny = Math.min(oy, y) - 1, maxy = Math.max(oy, y) + 2;
    PB.length = 0;
    for (const p of F.props) {
      if (!occOK(p) || p.x > maxx || p.x + p.w < minx || p.y > maxy || p.y + p.h < miny) continue;
      occBox(p, ox, oy, fy, PB);
    }
    return PB.length > 0 && segHit(PB, ox, oy, x, y);
  };
  L.seenActor = function(F, x, y) {
    if (L.visF !== F || !L.sv) return false;
    const tx = Math.floor(x), ty = Math.floor(y);
    if (!F.in(tx, ty)) return false;
    const i = ty * F.W + tx;
    if (L.sv[i] !== 1) return false;
    const O = L.occ;
    if (!O || !O.length) return true;
    for (let k = 0; k < O.length; k++) {
      const e = O[k];
      if (!gridClear(F, e.x, e.y, x, y)) continue;
      if (!segHit(e.b, e.x, e.y, x, y)) return true;
    }
    return false;
  };
  L.los = function(F, ax, ay, bx, by) {
    const d = Math.hypot(bx - ax, by - ay), n = Math.ceil(d * 3);
    for (let k = 1; k < n; k++) {
      const t = k / n;
      if (F.opaque(Math.floor(ax + (bx - ax) * t), Math.floor(ay + (by - ay) * t))) return false;
    }
    return true;
  };
  L.flash = function(floor, x, y, r, c, life, a) {
    L.dyn.push({
      floor,
      x,
      y,
      r,
      c: c || [ 255, 220, 150 ],
      t: life || .08,
      life: life || .08,
      a: a == null ? 1 : a
    });
  };
  L.update = function(dt) {
    for (let i = L.dyn.length - 1; i >= 0; i--) {
      L.dyn[i].t -= dt;
      if (L.dyn[i].t <= 0) L.dyn.splice(i, 1);
    }
  };
  let dark = null, glow = null, dctx = null, gctx = null, ov = null, octx = null, cone = null, cctx = null, pm = null, pmctx = null, un = null, unctx = null, ut = null, utctx = null;
  let gi = null, gictx = null, gl = null, glctx = null, gm = null, gmctx = null, mt = null, mtctx = null;
  let sdark = null, sdctx = null, sq = null, sqctx = null, sq2 = null, sq2ctx = null;
  let odark = null, odctx = null, oglow = null, ogctx = null, omc = null, omcx = null, omLast = null, oq1 = null, oq1x = null, oq2 = null, oq2x = null;
  const TR = 12, TIN = .3, TOUT = .5;
  const SC_K = .38, SC_R = 7, SC_A0 = 58 * Math.PI / 180, SC_A1 = 82 * Math.PI / 180;
  const sFall = u => u >= 1 ? 0 : Math.pow(1 - u, 1.1);
  const sAngF = h => {
    if (h <= SC_A0) return 1;
    if (h >= SC_A1) return 0;
    const u = (SC_A1 - h) / (SC_A1 - SC_A0);
    return u * u * (3 - 2 * u);
  };
  const SELF_N = [ 2.1, .3, .24, .24 ], SN0 = .9;
  const snF = d => {
    if (d <= SN0) return 1;
    if (d >= SELF_N[0]) return 0;
    const u = (SELF_N[0] - d) / (SELF_N[0] - SN0);
    return u * u * (3 - 2 * u);
  };
  let scK = 0;
  L.NEAR = 2.4;
  L.PNEAR = 3;
  L.PLIT = .12;
  const SELF_OFF = [ 2.2, .22 ], SELF_ON = [ 2.6, .45 ], SELF_PEER = [ 2.2, .3 ];
  L.SELF_R = {
    off: SELF_OFF[0],
    on: SELF_ON[0],
    peer: SELF_PEER[0]
  };
  let sm = null, smctx = null;
  L.self = null;
  L.selfBegin = function(cam, vw, vh, src) {
    L.self = null;
    const R = [];
    let ux0 = 1e9, uy0 = 1e9, ux1 = -1e9, uy1 = -1e9;
    for (const [x, y, rr] of src) {
      if (!isFinite(x) || !isFinite(y)) continue;
      const r = rr * TS + HALF + 2;
      const sx = x * TS - cam.x, sy = y * TS - cam.y;
      const x0 = Math.max(0, Math.floor(sx - r)), y0 = Math.max(0, Math.floor(sy - r)), x1 = Math.min(vw, Math.ceil(sx + r)), y1 = Math.min(vh, Math.ceil(sy + r));
      if (x1 - x0 < 1 || y1 - y0 < 1) continue;
      R.push(x0, y0, x1, y1);
      ux0 = Math.min(ux0, x0);
      uy0 = Math.min(uy0, y0);
      ux1 = Math.max(ux1, x1);
      uy1 = Math.max(uy1, y1);
    }
    if (!R.length) return null;
    if (!sm || sm.width !== vw || sm.height !== vh) {
      sm = SX.art.mk(vw, vh);
      smctx = sm.getContext("2d");
      L.sm = sm;
    }
    smctx.setTransform(1, 0, 0, 1, 0, 0);
    smctx.globalCompositeOperation = "source-over";
    smctx.globalAlpha = 1;
    smctx.imageSmoothingEnabled = false;
    smctx.clearRect(ux0, uy0, ux1 - ux0, uy1 - uy0);
    smctx.fillStyle = "#fff";
    smctx.fillRect(ux0, uy0, ux1 - ux0, uy1 - uy0);
    return L.self = {
      c: sm,
      g: smctx,
      R,
      x0: ux0,
      y0: uy0,
      x1: ux1,
      y1: uy1,
      w: ux1 - ux0,
      h: uy1 - uy0
    };
  };
  const PK = 4;
  const T0 = TIN * .85;
  const tFall = u => u >= 1 ? 0 : .97 * Math.pow(1 - u, .7);
  const tAngF = h => {
    if (h <= T0) return 1;
    if (h >= TOUT) return 0;
    const u = (TOUT - h) / (TOUT - T0);
    return u * u * (3 - 2 * u);
  };
  const OBJ_K = .85, FACE_MIN = .3;
  function torchAt(x, y, nx, ny, lx, ly, tc, ts) {
    const dx = x - lx, dy = y - ly, d = Math.hypot(dx, dy);
    if (d >= TR) return 0;
    if (d < .05) return tFall(0) * OBJ_K;
    const c = (dx * tc + dy * ts) / d, h = Math.acos(c > 1 ? 1 : c < -1 ? -1 : c), a = tAngF(h);
    let v = a > 0 ? tFall(d / TR) * a : 0;
    if (scK > 0 && d < SC_R) {
      const q = scK * sFall(d / SC_R) * sAngF(h);
      v = v + q - v * q;
    }
    if (v <= 0) return 0;
    const fc = Math.max(0, -(dx * nx + dy * ny) / d);
    return v * (FACE_MIN + (1 - FACE_MIN) * fc) * OBJ_K;
  }
  L.torchAt = torchAt;
  const SIL = new WeakMap;
  function silOf(c) {
    let s = SIL.get(c);
    if (s) return s;
    s = SX.art.mk(c.width, c.height);
    const x = s.getContext("2d");
    x.drawImage(c, 0, 0);
    x.globalCompositeOperation = "source-in";
    x.fillStyle = "rgb(255,238,200)";
    x.fillRect(0, 0, c.width, c.height);
    SIL.set(c, s);
    return s;
  }
  let scv = null, sctx = null;
  const CAPS = [];
  let ND = null;
  function outCone(x, y, w, h, sx, sy, ta) {
    if (sx >= x && sx <= x + w && sy >= y && sy <= y + h) return false;
    const M = (scK > 0 ? SC_A1 : TOUT) + .05;
    let lo = 0, hi = 0, back = 0;
    for (let k = 0; k < 4; k++) {
      let d = Math.atan2(y + (k & 2 ? h : 0) - sy, x + (k & 1 ? w : 0) - sx) - ta;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      if (Math.abs(d) <= M) return false;
      if (d < 0) lo++; else hi++;
      if (Math.abs(d) > Math.PI / 2) back++;
    }
    return lo === 4 || hi === 4 || back === 4;
  }
  let pcv = null, pctx = null;
  function puPaint(c, q, sil, w, h, src, al) {
    if (!pcv || pcv.width < w || pcv.height < h) {
      pcv = SX.art.mk(Math.max(w, pcv ? pcv.width : 0), Math.max(h, pcv ? pcv.height : 0));
      pctx = pcv.getContext("2d");
    }
    pctx.globalAlpha = 1;
    pctx.globalCompositeOperation = "copy";
    pctx.drawImage(src || sil, 0, 0, w, h, 0, 0, w, h);
    pctx.globalCompositeOperation = "destination-in";
    if (al < 1) {
      pctx.fillStyle = "rgba(0,0,0," + al.toFixed(3) + ")";
      pctx.fillRect(0, 0, w, h);
    }
    if (mt) pctx.drawImage(mt, -q.x, -q.y);
    pctx.globalCompositeOperation = "source-over";
    c.save();
    clipR(c, q.pu);
    c.globalCompositeOperation = "source-over";
    c.globalAlpha = 1;
    c.drawImage(pcv, 0, 0, w, h, q.x, q.y, w, h);
    c.restore();
  }
  function litObjects(F, cam, QW, SP, lx, ly, tc, ts, torch, LQ, sx, sy, ta) {
    const O = [];
    for (const q of QW) {
      const Q = q.t, FQ = q.f;
      if (!Q || !FQ) continue;
      for (let k = 0, n = 0; k < Q.length; k += 7, n++) {
        const f = FQ[n];
        if (outCone(Q[k] * TS - cam.x, Q[k + 1] * TS - cam.y, (Q[k + 2] - Q[k]) * TS, (Q[k + 3] - Q[k + 1]) * TS, sx, sy, ta)) continue;
        O.push({
          w: 1,
          Q,
          k,
          f,
          key: f === 0 ? Q[k + 3] - .06 : f === 1 ? Q[k + 1] + .06 : Q[k + 3]
        });
      }
    }
    for (const q of SP) {
      const g = q.g;
      if (!g || Math.hypot((g.bx0 + g.bx1) / 2 - lx, g.sy1 - ly) > TR + 3 || outCone(q.x, q.y, q.c.width, q.c.height, sx, sy, ta)) continue;
      O.push({
        w: 0,
        q,
        key: g.sy1
      });
    }
    if (!O.length) return;
    O.sort((a, b) => a.key - b.key);
    const B = L.visF === F && L.occ && L.occ.length ? L.occ[0].b : null;
    const c = cctx, ex = torch.x, ey = torch.y;
    for (const o of O) {
      if (o.w) {
        const Q = o.Q, k = o.k, f = o.f;
        const X0 = Q[k], Y0 = Q[k + 1], X1 = Q[k + 2], Y1 = Q[k + 3], fa = LQ ? 0 : Q[k + 4], fb = LQ ? 0 : Q[k + 5], vert = Q[k + 6];
        const x0 = X0 * TS - cam.x, y0 = Y0 * TS - cam.y, x1 = X1 * TS - cam.x, y1 = Y1 * TS - cam.y;
        const nx = f === 2 ? -1 : f === 3 ? 1 : 0, ny = f === 0 ? 1 : f === 1 ? -1 : 0;
        const A0 = vert ? Y0 : X0, A1 = vert ? Y1 : X1, o4 = .04, n4 = .16, s0 = A0 - (fa ? o4 : 0), s1 = A1 + (fb ? o4 : 0), len = Math.max(.001, s1 - s0);
        const ns = Math.max(2, Math.min(96, Math.ceil(len / .125) + 1)), vals = [];
        let vmax = 0;
        for (let j = 0; j < ns; j++) {
          const sA = s0 + len * j / (ns - 1), a = Math.min(A1, Math.max(A0, sA));
          let px, py;
          if (!vert) {
            px = a;
            py = f === 0 ? Y1 - .04 : Y0 + .04;
          } else {
            px = f === 2 ? X0 + .04 : X1 - .04;
            py = A1 - A0 > .76 ? A0 + .75 + (a - A0) * (A1 - A0 - .75) / (A1 - A0) : A1;
          }
          let v = torchAt(px, py, nx, ny, lx, ly, tc, ts);
          if (fa && sA < A0 + n4) v *= Math.max(0, Math.min(1, (sA - s0) / (o4 + n4)));
          if (fb && sA > A1 - n4) v *= Math.max(0, Math.min(1, (s1 - sA) / (o4 + n4)));
          vals.push(v);
          if (v > vmax) vmax = v;
        }
        if (vmax > .004) {
          c.globalCompositeOperation = "destination-out";
          c.fillStyle = "#fff";
          c.fillRect(x0, y0, x1 - x0, y1 - y0);
          const S0 = vert ? s0 * TS - cam.y : s0 * TS - cam.x, S1 = vert ? s1 * TS - cam.y : s1 * TS - cam.x;
          const gr = vert ? c.createLinearGradient(0, S0, 0, S1) : c.createLinearGradient(S0, 0, S1, 0);
          for (let j = 0; j < ns; j++) gr.addColorStop(j / (ns - 1), "rgba(255,238,200," + vals[j].toFixed(3) + ")");
          c.globalCompositeOperation = "source-over";
          c.fillStyle = gr;
          if (vert) c.fillRect(x0, S0, x1 - x0, S1 - S0); else c.fillRect(S0, y0, S1 - S0, y1 - y0);
          if (vert) {
            c.globalCompositeOperation = "destination-out";
            c.fillStyle = "#fff";
            for (let j = 0; j < CAPS.length; j += 4) if (CAPS[j] < X1 && CAPS[j + 2] > X0 && CAPS[j + 1] < Y1 && CAPS[j + 3] > Y0) c.fillRect(CAPS[j] * TS - cam.x, CAPS[j + 1] * TS - cam.y, (CAPS[j + 2] - CAPS[j]) * TS, (CAPS[j + 3] - CAPS[j + 1]) * TS);
          }
          if (ND && f === 0 && !vert) ND.walls(c, x0, y0, x1, y1, s0, len, vals, Y1, lx, ly, cam);
        }
        continue;
      }
      const q = o.q, g = q.g, w = q.c.width, h = q.c.height;
      c.globalCompositeOperation = "destination-out";
      if (q.nq) {
        if (q.nq.length) {
          c.save();
          clipR(c, q.nq);
          c.drawImage(q.c, q.x, q.y);
          c.restore();
        }
      } else c.drawImage(q.c, q.x, q.y);
      const pu = q.pu;
      if (pu) {
        c.save();
        clipR(c, pu);
        c.drawImage(q.c, q.x, q.y);
        c.restore();
      }
      if (q.dk) continue;
      if (q.lt && !q.lt.length && !pu) continue;
      const ns = 2, vals = [], py = g.sy1 - .02;
      let vmax = 0, vsum = 0;
      for (let j = 0; j < ns; j++) {
        const px = g.bx0 + .02 + (g.bx1 - g.bx0 - .04) * j / (ns - 1);
        let v = torchAt(px, py, 0, 1, lx, ly, tc, ts);
        if (v > 0 && (!gridClear(F, ex, ey, px, py) || B && segHitBut(B, ex, ey, px, py, g))) v = 0;
        vals.push(v);
        vsum += v;
        if (v > vmax) vmax = v;
      }
      if (vmax <= .004) continue;
      const sil = silOf(q.c);
      if (LQ) {
        if (pu) {
          puPaint(c, q, sil, w, h, null, vsum / ns);
          if (q.lt && !q.lt.length) continue;
        }
        if (q.lt) {
          c.save();
          clipR(c, q.lt);
        }
        c.globalCompositeOperation = "source-over";
        c.globalAlpha = vsum / ns;
        c.drawImage(sil, q.x, q.y);
        c.globalAlpha = 1;
        if (q.lt) c.restore();
        if (ND) ND.prop(c, q.c, q.x, q.y, (g.bx0 + g.bx1) / 2, g.sy1, lx, ly, vsum / ns, q.lt);
        continue;
      }
      if (!scv || scv.width < w || scv.height < h) {
        scv = SX.art.mk(Math.max(w, scv ? scv.width : 0), Math.max(h, scv ? scv.height : 0));
        sctx = scv.getContext("2d");
      }
      sctx.globalCompositeOperation = "copy";
      sctx.drawImage(sil, 0, 0);
      sctx.globalCompositeOperation = "destination-in";
      const gx0 = g.bx0 * TS - cam.x - q.x, gx1 = g.bx1 * TS - cam.x - q.x, gh = sctx.createLinearGradient(gx0, 0, gx1, 0);
      for (let j = 0; j < ns; j++) gh.addColorStop(j / (ns - 1), "rgba(0,0,0," + vals[j].toFixed(3) + ")");
      sctx.fillStyle = gh;
      sctx.fillRect(0, 0, w, h);
      const gv = sctx.createLinearGradient(0, 0, 0, h);
      gv.addColorStop(0, "rgba(0,0,0,0.8)");
      gv.addColorStop(1, "rgba(0,0,0,1)");
      sctx.fillStyle = gv;
      sctx.fillRect(0, 0, w, h);
      if (!q.lt || q.lt.length) {
        if (q.lt) {
          c.save();
          clipR(c, q.lt);
        }
        c.globalCompositeOperation = "source-over";
        c.drawImage(scv, 0, 0, w, h, q.x, q.y, w, h);
        if (q.lt) c.restore();
      }
      if (pu) {
        puPaint(c, q, null, w, h, scv, 1);
        if (q.lt && !q.lt.length) continue;
      }
      if (ND) ND.prop(c, q.c, q.x, q.y, (g.bx0 + g.bx1) / 2, g.sy1, lx, ly, vsum / ns * .9, q.lt);
    }
    c.globalCompositeOperation = "source-over";
    c.globalAlpha = 1;
  }
  function eyeRooms(F, O) {
    const s = new Set;
    for (const e of O) {
      const tx = Math.floor(e.x), ty = Math.floor(e.y);
      if (F.in(tx, ty) && F.room[F.i(tx, ty)] >= 0) {
        s.add(F.room[F.i(tx, ty)]);
        continue;
      }
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!F.in(tx + dx, ty + dy)) continue;
        const r = F.room[F.i(tx + dx, ty + dy)];
        if (r >= 0) s.add(r);
      }
    }
    return s;
  }
  function propRoom(F, p, g) {
    if (p._rmF === F && p._rmX === g.X && p._rmY === g.Y) return p._rm;
    const x0 = Math.floor(g.X + 1e-6), x1 = Math.ceil(g.X + p.w - 1e-6) - 1, y0 = Math.floor(g.Y + 1e-6), y1 = Math.ceil(g.Y + p.h - 1e-6) - 1, cnt = new Map;
    for (const [a, b] of [ [ y0, y1 ], [ y1 + 1, y1 + 1 ] ]) {
      for (let y = a; y <= b; y++) for (let x = x0; x <= x1; x++) {
        if (!F.in(x, y)) continue;
        const r = F.room[F.i(x, y)];
        if (r >= 0) cnt.set(r, (cnt.get(r) || 0) + 1);
      }
      if (cnt.size) break;
    }
    let best = -1, n = 0;
    for (const [r, c] of cnt) if (c > n) {
      n = c;
      best = r;
    }
    p._rmF = F;
    p._rmX = g.X;
    p._rmY = g.Y;
    p._rm = best;
    return best;
  }
  const ROOM_FADE = .3;
  let rmc = null, rmcx = null, rml = null, rmlx = null, rmt = null, rmtx = null, rmq = null, rmqx = null, rmLast = null;
  L.room = null;
  L.rmFr = 0;
  const LMIN = .06, LDY = .04, XS = [], T1 = [], T2 = [], CW = [];
  const FIRE = {
    fire: 1,
    heater: 1,
    blaze: 1
  }, FIRE_A = {
    fire: true
  };
  const burning = p => FIRE[p.kind] === 1 && !p.furn && (p.v | 0) < (SX.homeUse && SX.homeUse.OFFV || 1e3);
  function bbOf(Q) {
    let b = Q._bb;
    if (!b) {
      let a0 = 1e9, a1 = 1e9, a2 = -1e9, a3 = -1e9;
      for (let k = 0; k < Q.length; k += 2) {
        const x = Q[k], v = Q[k + 1];
        if (x < a0) a0 = x;
        if (x > a2) a2 = x;
        if (v < a1) a1 = v;
        if (v > a3) a3 = v;
      }
      b = Q._bb = [ a0, a1, a2, a3 ];
    }
    return b;
  }
  function rowBk(Q) {
    let K = Q._rk;
    if (K) return K;
    const b = bbOf(Q), r0 = Math.floor(b[1]), n = Math.floor(b[3]) - r0 + 1, Rw = new Array(n);
    for (let i = 0; i < n; i++) Rw[i] = [];
    for (let k = 0, j = Q.length - 2; k < Q.length; j = k, k += 2) {
      const ya = Q[j + 1], yb = Q[k + 1], lo = Math.floor(ya < yb ? ya : yb) - r0, hi = Math.floor(ya < yb ? yb : ya) - r0;
      for (let r = lo; r <= hi; r++) Rw[r].push(j, k);
    }
    return Q._rk = {
      r0,
      R: Rw
    };
  }
  function polyRow(Q, y, x0, x1, out) {
    const b = bbOf(Q);
    if (y <= b[1] || y >= b[3] || x1 <= b[0] || x0 >= b[2]) return;
    const K = rowBk(Q), E = K.R[Math.floor(y) - K.r0];
    if (!E) return;
    XS.length = 0;
    for (let i = 0; i < E.length; i += 2) {
      const j = E[i], k = E[i + 1], ya = Q[j + 1], yb = Q[k + 1];
      if (ya <= y !== yb <= y) XS.push(Q[j] + (y - ya) * (Q[k] - Q[j]) / (yb - ya));
    }
    XS.sort((p, q) => p - q);
    for (let k = 0; k + 1 < XS.length; k += 2) {
      const a = XS[k] > x0 ? XS[k] : x0, c = XS[k + 1] < x1 ? XS[k + 1] : x1;
      if (c > a) out.push(a, c);
    }
  }
  function segRect(ax, ay, bx, by, x0, y0, x1, y1) {
    if ((ax > bx ? ax : bx) < x0 || (ax < bx ? ax : bx) > x1 || (ay > by ? ay : by) < y0 || (ay < by ? ay : by) > y1) return false;
    const dx = bx - ax, dy = by - ay, s1 = dx * (y0 - ay) - dy * (x0 - ax), s2 = dx * (y0 - ay) - dy * (x1 - ax), s3 = dx * (y1 - ay) - dy * (x0 - ax), s4 = dx * (y1 - ay) - dy * (x1 - ax);
    return !(s1 > 0 && s2 > 0 && s3 > 0 && s4 > 0 || s1 < 0 && s2 < 0 && s3 < 0 && s4 < 0);
  }
  function rectCov(P, x0, y0, x1, y1) {
    let cross = false;
    for (let n = 0; n < P.length; n++) {
      const Q = P[n];
      if (!Q || Q.length < 6) continue;
      const b = bbOf(Q);
      if (x1 <= b[0] || x0 >= b[2] || y1 <= b[1] || y0 >= b[3]) continue;
      const K = rowBk(Q);
      let hit = false;
      for (let r = Math.max(0, Math.floor(y0) - K.r0), re = Math.min(K.R.length - 1, Math.floor(y1) - K.r0); r <= re && !hit; r++) {
        const E = K.R[r];
        for (let i = 0; i < E.length; i += 2) {
          const j = E[i], k = E[i + 1];
          if (segRect(Q[j], Q[j + 1], Q[k], Q[k + 1], x0, y0, x1, y1)) {
            hit = true;
            break;
          }
        }
      }
      if (hit) {
        cross = true;
        continue;
      }
      const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, E = K.R[Math.floor(cy) - K.r0];
      let ins = false;
      if (E) for (let i = 0; i < E.length; i += 2) {
        const j = E[i], k = E[i + 1], ya = Q[j + 1], yb = Q[k + 1];
        if (ya <= cy !== yb <= cy && Q[j] + (cy - ya) * (Q[k] - Q[j]) / (yb - ya) > cx) ins = !ins;
      }
      if (ins) return 1;
    }
    return cross ? 2 : 0;
  }
  function cutIv(T, c0, c1) {
    T2.length = 0;
    for (let k = 0; k < T.length; k += 2) {
      const a = T[k], b = T[k + 1];
      if (c1 <= a || c0 >= b) {
        T2.push(a, b);
        continue;
      }
      if (c0 > a) T2.push(a, c0);
      if (c1 < b) T2.push(c1, b);
    }
    T.length = 0;
    for (let k = 0; k < T2.length; k++) T.push(T2[k]);
  }
  const own = (B, j, g) => Math.abs(B[j] - g.bx0) < 1e-6 && Math.abs(B[j + 2] - g.bx1) < 1e-6 && B[j + 1] < g.by1 + 1e-6 && B[j + 3] > g.sy0 - 1e-6;
  const RM = .5, RH = 1 / 32, T3 = [], BI = [];
  let SMP = null, SMC = null;
  function rayOk(F, e, x, y) {
    if (!gridClear(F, e.x, e.y, x, y)) return false;
    const B = e.b, ux = x - e.x, uy = y - e.y;
    for (let k = 0; k < BI.length; k++) if (slab(B, BI[k], e.x, e.y, ux, uy) && SL[0] < 1 - 1e-6) return false;
    return !(SMC && SX.tac.smokeBlocks(F, e.x, e.y, x, y));
  }
  function rowRay(F, Q, e, y, a, b, g, full) {
    BI.length = 0;
    const B = e.b;
    if (B) {
      const lx = Math.min(e.x, a), hx = Math.max(e.x, b), ly = Math.min(e.y, y), hy = Math.max(e.y, y);
      for (let j = 0; j < B.length; j += 4) {
        if (B[j] > hx || B[j + 2] < lx || B[j + 1] > hy || B[j + 3] < ly || own(B, j, g)) continue;
        BI.push(j);
      }
    }
    const n = Math.max(1, Math.min(128, Math.ceil((b - a) / RH))), h = (b - a) / n;
    if (full && rayOk(F, e, a + h / 2, y) && rayOk(F, e, b - h / 2, y)) return;
    T3.length = 0;
    polyRow(Q, y, a - RM, b + RM, T3);
    if (!T3.length) return;
    T1.length = 0;
    let s = -1;
    for (let i = 0; i <= n; i++) {
      let ok = false;
      if (i < n) {
        const x = a + (i + .5) * h;
        for (let j = 0; j < T3.length; j += 2) if (x >= T3[j] - RM && x <= T3[j + 1] + RM) {
          ok = rayOk(F, e, x, y);
          break;
        }
      }
      if (ok) {
        if (s < 0) s = i;
      } else if (s >= 0) {
        T1.push(a + s * h, a + i * h);
        s = -1;
      }
    }
  }
  function rowLit(F, y, a, b, g, out, fy) {
    const P = L.polys, O = L.occ;
    if (SMP !== P) {
      SMP = P;
      SMC = SX.tac && SX.tac.smokes && SX.tac.smokeBlocks ? SX.tac.smokes(F) : null;
    }
    for (let k = 0; k < P.length; k++) {
      const Q = P[k];
      if (!Q || Q.length < 6) continue;
      if (fy > -1e8 && O[k] && O[k].y <= fy) continue;
      T1.length = 0;
      polyRow(Q, y, a, b, T1);
      const B = O[k] && O[k].b;
      if (B) for (let j = 0; j < B.length && T1.length; j += 4) {
        if (!(B[j + 1] < y && B[j + 3] > y) || B[j] >= b || B[j + 2] <= a || own(B, j, g)) continue;
        cutIv(T1, B[j], B[j + 2]);
      }
      if (O[k]) rowRay(F, Q, O[k], y, a, b, g, T1.length === 2 && T1[0] <= a + 1e-6 && T1[1] >= b - 1e-6);
      for (let j = 0; j < T1.length; j++) out.push(T1[j]);
    }
  }
  let FYc = -1e9;
  function backW(F, tx, g) {
    const r = Math.floor(g.sy0 + 1e-6);
    if (g.sy0 - r < .5 && lineB(F, tx, r - 1)) FYc = r;
  }
  function footY(F, tx, g) {
    FYc = -1e9;
    const y = g.sy1 - LDY, ty = Math.floor(y);
    if (!F.opaqueTile(tx, ty)) {
      backW(F, tx, g);
      return y;
    }
    for (let r = ty - 1; r >= Math.floor(g.sy0 + 1e-6); r--) if (!F.opaqueTile(tx, r)) {
      backW(F, tx, g);
      return r + 1 - LDY;
    }
    for (let r = ty + 1; r <= ty + 2; r++) if (!F.opaqueTile(tx, r)) {
      FYc = r;
      return r + LDY;
    }
    return null;
  }
  const WLn = (F, x, y) => lineB(F, x, y) || F.in(x, y) && F.t[y * F.W + x] === T.DOOR;
  let CYb = 0, CYs = null, CYf = -1e9;
  function colY(F, tx, g) {
    const ty = Math.floor(g.sy1 - LDY);
    if (F.opaqueTile(tx, ty)) {
      CYb = 1e9;
      CYs = footY(F, tx, g);
      CYf = FYc;
      return;
    }
    for (let r = ty - 1, r0 = Math.floor(g.by0 + 1e-6); r >= r0; r--) if (WLn(F, tx, r)) {
      CYb = r + 1;
      CYs = r + 1 + LDY;
      CYf = r + 1;
      return;
    }
    CYb = -1e9;
    CYs = null;
    CYf = -1e9;
  }
  function propCols(F, p, g) {
    const P = L.visF === F ? L.polys : null;
    if (!P || !P.length) return null;
    const c0 = p._lc;
    if (c0 && c0.P === P && c0.n === P.length && c0.g === g) return c0.st;
    const x0 = g.bx0, x1 = g.bx1, G = [];
    let iv = [], st = 0;
    if (x1 - x0 > .001) {
      const tx0 = Math.floor(x0), tx1 = Math.max(tx0, Math.ceil(x1) - 1);
      colY(F, tx0, g);
      let gs = tx0, gb = CYb, gy = CYs, gf = CYf;
      for (let tx = tx0 + 1; tx <= tx1 + 1; tx++) {
        let nb = 0, ny = null, nf = 0;
        if (tx <= tx1) {
          colY(F, tx, g);
          nb = CYb;
          ny = CYs;
          nf = CYf;
          if (nb === gb && ny === gy && nf === gf) continue;
        }
        const a = Math.max(x0, gs), b = Math.min(x1, tx);
        if (b > a) G.push({
          a,
          b,
          yb: gb,
          ys: gy,
          fy: gf,
          lo: -1
        });
        gs = tx;
        gb = nb;
        gy = ny;
        gf = nf;
      }
      const mn = Math.min(LMIN, (x1 - x0) / 3);
      const W = CW, nul = [];
      W.length = 0;
      let hasU = false;
      for (const q of G) {
        if (q.yb <= g.by0) continue;
        hasU = true;
        if (q.ys == null) nul.push(q.a, q.b); else rowLit(F, q.ys, q.a, q.b, g, W, q.fy);
      }
      if (hasU) {
        for (let k = 0; k < W.length; k += 2) iv.push([ W[k], W[k + 1] ]);
        const mg = gap => {
          iv.sort((p, q) => p[0] - q[0]);
          const m = [];
          for (const v of iv) {
            const t = m[m.length - 1];
            if (t && v[0] <= t[1] + gap) {
              if (v[1] > t[1]) t[1] = v[1];
            } else m.push([ v[0], v[1] ]);
          }
          iv = m;
        };
        mg(1e-6);
        if (nul.length) {
          const add = [];
          for (let k = 0; k < nul.length; k += 2) {
            const a = nul[k], b = nul[k + 1];
            if (iv.some(v => v[1] >= a - 1e-6 && v[0] < a || v[0] <= b + 1e-6 && v[1] > b)) add.push([ a, b ]);
          }
          if (add.length) {
            iv = iv.concat(add);
            mg(1e-6);
          }
        }
        mg(mn);
        iv = iv.filter(v => v[1] - v[0] >= mn);
        if (iv.length) {
          if (iv[0][0] - x0 < mn) iv[0][0] = x0;
          const t = iv[iv.length - 1];
          if (x1 - t[1] < mn) t[1] = x1;
        }
      }
      for (const q of G) {
        if (q.yb >= g.by1) continue;
        const ya = Math.max(g.by0, q.yb), yb = g.by1, d = Math.min(LDY, (yb - ya) / 4), e = Math.min(.02, (q.b - q.a) / 4);
        q.lo = rectCov(P, q.a + e, ya + d, q.b - e, yb - d);
      }
      let l1 = false, l0 = false, l2 = false;
      for (const q of G) {
        if (q.yb > g.by0) {
          let e = q.a;
          for (const v of iv) {
            const u = Math.max(v[0], q.a), w = Math.min(v[1], q.b);
            if (w - u > 1e-6) {
              l1 = true;
              if (u - e > 1e-6) l0 = true;
              e = w;
            }
          }
          if (q.b - e > 1e-6) l0 = true;
        }
        if (q.yb < g.by1) {
          if (q.lo === 1) l1 = true; else if (q.lo === 0) l0 = true; else l2 = true;
        }
      }
      st = l1 && !l0 && !l2 ? 1 : !l1 && !l2 ? 0 : 2;
    }
    p._lc = {
      P,
      n: P.length,
      g,
      st,
      G,
      iv,
      cx: NaN,
      cy: NaN,
      s: null,
      s2: 0
    };
    return st;
  }
  function scrR(c, g, cx, cy) {
    const X = v => v <= g.bx0 + 1e-6 ? -1e5 : v >= g.bx1 - 1e-6 ? 1e5 : Math.round(v * TS - cx);
    const lt = [], dk = [], pm = [], put = (A, a, y0, b, y1) => {
      const xa = X(a), xb = X(b);
      if (xb > xa && y1 > y0) A.push(xa, y0, xb, y1);
    };
    for (const q of c.G) {
      const yb = q.yb >= g.by1 ? 1e5 : q.yb <= g.by0 ? -1e5 : Math.round(q.yb * TS - cy);
      if (q.yb > g.by0) {
        let e = q.a;
        for (const v of c.iv) {
          const u = Math.max(v[0], q.a), w = Math.min(v[1], q.b);
          if (w - u <= 1e-6) continue;
          if (u > e) put(dk, e, -1e5, u, yb);
          put(lt, u, -1e5, w, yb);
          e = w;
        }
        if (q.b > e) put(dk, e, -1e5, q.b, yb);
      }
      if (q.yb < g.by1) put(q.lo === 1 ? lt : q.lo === 0 ? dk : pm, q.a, yb, q.b, 1e5);
    }
    return {
      sp: true,
      lt,
      dk,
      pm,
      nq: lt.concat(dk)
    };
  }
  function geoR(p) {
    const g = L.propGeo(p), H = p.riders;
    if (!H || !H.length) return g;
    let bx0 = g.bx0, by0 = g.by0, bx1 = g.bx1;
    const K = [];
    for (const q of H) {
      if (!q || q.hidden || !q.ride || q.ride.host !== p) continue;
      const r = L.propGeo(q);
      K.push(r);
      if (r.bx0 < bx0) bx0 = r.bx0;
      if (r.by0 < by0) by0 = r.by0;
      if (r.bx1 > bx1) bx1 = r.bx1;
    }
    if (by0 >= g.by0 && bx0 >= g.bx0 && bx1 <= g.bx1) return g;
    const c = p._vgr;
    if (c && c.g === g && c.K.length === K.length && c.K.every((r, i) => r === K[i])) return c.x;
    const x = Object.assign({}, g, {
      bx0,
      by0,
      bx1
    });
    p._vgr = {
      g,
      K,
      x
    };
    return x;
  }
  function propSt(F, p, g, cx, cy) {
    const st = propCols(F, p, g);
    if (st !== 2) return st;
    const c = p._lc;
    if (c.cx !== cx || c.cy !== cy) {
      c.cx = cx;
      c.cy = cy;
      const S = c.s = scrR(c, g, cx, cy);
      c.s2 = S.lt.length && !S.dk.length && !S.pm.length ? 1 : !S.lt.length && !S.pm.length ? 0 : 2;
    }
    return c.s2;
  }
  function needFill(F, g, R) {
    const Lt = R.lit;
    for (let k = 0; k < Lt.length; k += 4) if (Lt[k] < g.bx1 && Lt[k + 2] > g.bx0 && Lt[k + 1] < g.by1 && Lt[k + 3] > g.by0) return true;
    const V = L.vis, W = F.W, tx0 = Math.max(0, Math.floor(g.bx0) - 1), tx1 = Math.min(W - 1, Math.floor(g.bx1) + 1), ty0 = Math.max(0, Math.floor(g.by0) - 1), ty1 = Math.min(F.H - 1, Math.floor(g.by1) + 1);
    for (let y = ty0; y <= ty1; y++) for (let x = tx0; x <= tx1; x++) if (V[y * W + x]) return true;
    return false;
  }
  L.roomBegin = function(F, cam, vw, vh) {
    L.room = null;
    if (!F || L.visF !== F || !L.polys || !L.polys.length) return null;
    const now = SX.view.gt || 0, dt = Math.min(.1, Math.max(0, now - (L.rfT == null ? now : L.rfT)));
    L.rfT = now;
    if (L.rfF !== F) {
      L.rfF = F;
      L.rfA = new WeakMap;
    }
    L.rmFr++;
    if (!rmc || rmc.width !== vw || rmc.height !== vh) {
      rmc = SX.art.mk(vw, vh);
      rmcx = rmc.getContext("2d");
      rml = SX.art.mk(vw, vh);
      rmlx = rml.getContext("2d");
      rmt = SX.art.mk(vw, vh);
      rmtx = rmt.getContext("2d");
      rmq = SX.art.mk(vw, vh);
      rmqx = rmq.getContext("2d");
      L.rmc = rmc;
      L.rml = rml;
      L.rmq = rmq;
      rmLast = null;
    }
    rmcx.setTransform(1, 0, 0, 1, 0, 0);
    rmcx.globalCompositeOperation = "source-over";
    rmcx.globalAlpha = 1;
    rmcx.imageSmoothingEnabled = false;
    if (!rmLast || rmLast.any) rmcx.clearRect(0, 0, vw, vh);
    rmqx.setTransform(1, 0, 0, 1, 0, 0);
    rmqx.globalCompositeOperation = "source-over";
    rmqx.globalAlpha = 1;
    rmqx.imageSmoothingEnabled = false;
    if (!rmLast || rmLast.anyQ) rmqx.clearRect(0, 0, vw, vh);
    return rmLast = L.room = {
      F,
      now,
      dt,
      c: rmcx,
      l: rmlx,
      q: rmqx,
      any: false,
      anyQ: false,
      cx: cam.x,
      cy: cam.y,
      lit: [],
      dd: []
    };
  };
  function dOutAt(F, x, y) {
    if (x < 0 || y < 0 || x >= F.W || y >= F.H) return !!F.out;
    const i = y * F.W + x;
    return !(F.inside[i] && !(F.voidAt && F.voidAt(x, y))) && !SX.homeOut.roofAt(F, x, y);
  }
  function dayIn(F, g) {
    if (L.dayF !== F || !SX.homeOut) return false;
    if (dOutAt(F, Math.floor((g.bx0 + g.bx1) / 2), Math.floor(g.by1 - .05))) return false;
    const x0 = Math.floor(g.bx0), x1 = Math.floor(g.bx1 - 1e-6), y0 = Math.floor(g.by0), y1 = Math.floor(g.by1 - .05);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (dOutAt(F, x, y)) return true;
    return false;
  }
  L.roomA = function(F, p) {
    const R = L.room;
    if (!R || R.F !== F) return null;
    if (p.flat || p.kind === "loot" || p.kind === "corpse") return null;
    if (p._lrR === R) return p._lrA;
    const g = geoR(p);
    let a = null, dI = false;
    if (g.by0 < g.Y - .05) {
      const st = propSt(F, p, g, R.cx, R.cy);
      dI = (st === 0 || st === 2) && dayIn(F, g);
      if (st === 0) a = dI || needFill(F, g, R) ? 0 : -1; else if (st === 1 || st === 2) {
        R.lit.push(g.bx0, g.by0, g.bx1, g.by1);
        a = st === 1 ? 1 : p._lc.s;
      }
    } else if (burning(p) && L.visF === F && L.polys && rectCov(L.polys, g.bx0 + .02, g.by0 + .02, g.bx1 - .02, g.by1 - .02) === 1) a = 1;
    if (a !== 1 && burning(p)) {
      a = FIRE_A;
      R.lit.push(g.bx0, g.by0, g.bx1, g.by1);
    }
    if (dI && (a === 0 || a && (a.sp || a.fire))) R.dd.push((g.bx0 - .25) * TS - R.cx, (g.by0 - .6) * TS - R.cy, (g.bx1 + .25) * TS - R.cx, g.by1 * TS - R.cy + 4);
    p._lrR = R;
    p._lrA = a;
    return a;
  };
  function seenProps(F, cam, vw, vh) {
    const out = [];
    if (L.visF !== F || !L.polys || !L.polys.length) return out;
    const x0 = cam.x / TS - 3, x1 = (cam.x + vw) / TS + 1, y0 = cam.y / TS - 1, y1 = (cam.y + vh) / TS + 3;
    for (const p of F.props) {
      if (p.hidden || p.flat || p.kind === "loot" || p.kind === "corpse" || p.x > x1 || p.x + p.w < x0 || p.y > y1 || p.y + p.h < y0) continue;
      const g = geoR(p);
      if (!(g.by0 < g.Y - .05)) continue;
      const st = propSt(F, p, g, cam.x, cam.y);
      if (st == null) continue;
      const sp = SX.art.prop(p.kind, p.v, p.col, p.rot);
      if (!sp) continue;
      const S = st === 2 ? p._lc.s : null, fi = st !== 1 && burning(p);
      out.push({
        c: sp.c,
        x: Math.round(g.X * TS - cam.x),
        y: Math.round(g.Y * TS - cam.y) + sp.oy,
        g,
        ul: S && S.lt,
        lt: fi ? null : S && S.lt,
        nq: fi ? null : S && S.nq,
        pu: fi || !S || !S.pm.length ? null : pmUp(S.pm, Math.round(g.sy0 * TS - cam.y)),
        dk: st === 0 && !fi,
        fire: fi
      });
    }
    return out;
  }
  function pmUp(pm, ys) {
    const out = [];
    for (let k = 0; k < pm.length; k += 4) {
      const y1 = Math.min(pm[k + 3], ys);
      if (y1 > pm[k + 1] && pm[k + 2] > pm[k]) out.push(pm[k], pm[k + 1], pm[k + 2], y1);
    }
    return out.length ? out : null;
  }
  function clipR(c, Rr) {
    c.beginPath();
    for (let k = 0; k < Rr.length; k += 4) c.rect(Rr[k], Rr[k + 1], Rr[k + 2] - Rr[k], Rr[k + 3] - Rr[k + 1]);
    c.clip();
  }
  L.propCols = function(F, p) {
    const g = geoR(p);
    const st = propCols(F, p, g);
    if (st == null) return null;
    const c = p._lc;
    return {
      st,
      lt: st === 2 && c.iv.length ? [].concat(...c.iv) : null,
      G: c.G.map(q => ({
        a: q.a,
        b: q.b,
        yb: q.yb,
        lo: q.lo
      })),
      g
    };
  };
  const OWN = {
    bigTank: 1,
    fishTank: 1,
    heater: 1,
    fire: 1,
    tv: 1,
    vending: 1,
    atm: 1,
    waterCase: 1
  };
  L.ownBegin = function(F, cam, vw, vh) {
    L.om = null;
    if (!F || !F.lamps || !F.lamps.length) return null;
    const x0 = cam.x / TS - 8, x1 = (cam.x + vw) / TS + 8, y0 = cam.y / TS - 8, y1 = (cam.y + vh) / TS + 8;
    let set = null;
    for (const l of F.lamps) {
      const p = l.prop;
      if (!l.furn || !p || !OWN[p.kind] || l.x < x0 || l.x > x1 || l.y < y0 || l.y > y1) continue;
      (set || (set = new Set)).add(p);
    }
    if (!set) return null;
    if (!omc || omc.width !== vw || omc.height !== vh) {
      omc = SX.art.mk(vw, vh);
      omcx = omc.getContext("2d");
      L.omc = omc;
      omLast = null;
    }
    omcx.setTransform(1, 0, 0, 1, 0, 0);
    omcx.globalCompositeOperation = "source-over";
    omcx.globalAlpha = 1;
    omcx.imageSmoothingEnabled = false;
    if (omLast && omLast.any) omcx.clearRect(omLast.x0 - 1, omLast.y0 - 1, omLast.x1 - omLast.x0 + 2, omLast.y1 - omLast.y0 + 2);
    return omLast = L.om = {
      F,
      c: omcx,
      set,
      any: false,
      x0: 1e9,
      y0: 1e9,
      x1: -1e9,
      y1: -1e9
    };
  };
  L.render = function(ctx, cam, vw, vh, F, env, torch, gas, others) {
    const cx0 = Math.floor(cam.x / HALF) - 1, cy0 = Math.floor(cam.y / HALF) - 1;
    const cw = Math.ceil(vw / HALF) + 3, ch = Math.ceil(vh / HALF) + 3;
    if (!dark || dark.width !== cw || dark.height !== ch) {
      dark = SX.art.mk(cw, ch);
      glow = SX.art.mk(cw, ch);
      ut = SX.art.mk(cw, ch);
      gi = SX.art.mk(cw, ch);
      dctx = dark.getContext("2d");
      gctx = glow.getContext("2d");
      utctx = ut.getContext("2d");
      gictx = gi.getContext("2d");
      L.dImg = dctx.createImageData(cw, ch);
      L.gImg = gctx.createImageData(cw, ch);
      L.uImg = utctx.createImageData(cw, ch);
      L.iImg = gictx.createImageData(cw, ch);
      sdark = SX.art.mk(cw, ch);
      sdctx = sdark.getContext("2d");
      L.sImg = sdctx.createImageData(cw, ch);
      L.tk = new Float32Array(cw * ch);
      L.vc = new Uint8Array(cw * ch);
    }
    if (!ov || ov.width !== vw || ov.height !== vh) {
      ov = SX.art.mk(vw, vh);
      octx = ov.getContext("2d");
      cone = SX.art.mk(vw, vh);
      cctx = cone.getContext("2d");
      un = SX.art.mk(vw, vh);
      unctx = un.getContext("2d");
      pm = SX.art.mk(Math.ceil(vw / PK) + 1, Math.ceil(vh / PK) + 1);
      pmctx = pm.getContext("2d");
      gl = SX.art.mk(Math.ceil(vw / PK) + 1, Math.ceil(vh / PK) + 1);
      glctx = gl.getContext("2d");
      gm = SX.art.mk(Math.ceil(vw / PK) + 1, Math.ceil(vh / PK) + 1);
      gmctx = gm.getContext("2d");
      mt = SX.art.mk(vw, vh);
      mtctx = mt.getContext("2d");
      L.pm = pm;
      L.un = un;
      L.cone = cone;
    }
    const D = L.dImg.data, G = L.gImg.data, U = L.uImg.data, GI = L.iImg.data, TK = L.tk, VC = L.vc, GV = L.visF === F ? L.gv : null, DV = L.visF === F ? L.dv : null;
    const SD = L.sImg.data;
    let selfDiff = false;
    const LQ = !!(SX.opts && SX.opts.lightQ === "low"), SM = !LQ;
    const night = !!env.night;
    const dayO = !night && !!(env.hub && F.out && F.out.day);
    L.dayF = dayO ? F : null;
    const lights = [];
    const lx0 = cx0 / 2 - 1, lx1 = (cx0 + cw) / 2 + 1, ly0 = cy0 / 2 - 1, ly1 = (cy0 + ch) / 2 + 1;
    for (const l of F.lamps) {
      if (l.out && dayO && !l.day) continue;
      if (l.out && (l.x + l.r < lx0 || l.x - l.r > lx1 || l.y + l.r < ly0 || l.y - l.r > ly1)) continue;
      if (F.seeOff && F.seeOff(Math.floor(l.x), Math.floor(l.y))) continue;
      lights.push(l);
    }
    for (const l of L.dyn) if (l.floor === F.idx) lights.push({
      x: l.x,
      y: l.y,
      r: l.r,
      c: l.c,
      a: l.a * (l.t / l.life)
    });
    const OM = L.om && L.om.F === F && L.om.any ? L.om : null, ownL = [];
    L.om = null;
    for (const l of lights) {
      if (l._ob) l._ob = null;
      if (OM && l.furn && l.prop && OM.set.has(l.prop)) {
        const g = geoR(l.prop);
        l._ob = [ g.bx0 - .5, g.by0 - .5, g.bx1 + .5, g.by1 + .5, l.prop.y + l.prop.h ];
        ownL.push(l);
      }
    }
    ownL.sort((p, q) => q._ob[4] - p._ob[4]);
    let OD = null, OG = null;
    if (ownL.length) {
      if (!odark || odark.width !== cw || odark.height !== ch) {
        odark = SX.art.mk(cw, ch);
        odctx = odark.getContext("2d");
        oglow = SX.art.mk(cw, ch);
        ogctx = oglow.getContext("2d");
        L.oImg = odctx.createImageData(cw, ch);
        L.ogImg = ogctx.createImageData(cw, ch);
      }
      OD = L.oImg.data;
      OG = L.ogImg.data;
      OD.fill(0);
      OG.fill(0);
    }
    const flick = .92 + Math.sin(performance.now() / 70) * .05 + Math.sin(performance.now() / 23) * .03;
    const tOn = !!(torch && torch.on);
    const tAng = torch ? torch.a : 0, tCos = Math.cos(tAng), tSin = Math.sin(tAng);
    const TCUT = Math.cos(TOUT), TCUT2 = Math.cos(TIN);
    const nR = night && !env.hub && !env.nv;
    scK = tOn && night && !env.hub ? SC_K : 0;
    const SCUT = Math.cos(SC_A1);
    L.NEAR = night && !env.hub ? 2 : 2.4;
    L.PNEAR = night && !env.hub ? 2 : 3;
    L.PLIT = night && !env.hub ? .16 : .12;
    const oth = (others || []).filter(q => isFinite(q.x) && isFinite(q.y) && isFinite(q.a)).map(q => ({
      x: q.x,
      y: q.y,
      c: Math.cos(q.a),
      s: Math.sin(q.a)
    }));
    const flashB = env.flashT > 0 ? env.flashT * 2.2 : 0;
    L.unF = F.kind === "hub" ? .55 : env.nv ? .08 : .32;
    L.unA = 1 - L.unF;
    const UA = Math.round(L.unA * 255), UD = Math.round(.14 * 255);
    L.glA = L.unA * .88;
    const GA8 = Math.round(L.glA * 255);
    for (let cy = 0; cy < ch; cy++) {
      const wy = (cy0 + cy + .5) / 2;
      for (let cx = 0; cx < cw; cx++) {
        const wx = (cx0 + cx + .5) / 2;
        const tx = Math.floor(wx), ty = Math.floor(wy);
        const c1 = cy * cw + cx, o = c1 * 4;
        let lum, r = 0, g = 0, b = 0;
        let ol = null, oq = 0, oR = 0, oG = 0, oB = 0;
        if (OD) for (const l of ownL) {
          const B = l._ob;
          if (wx >= B[0] && wx < B[2] && wy >= B[1] && wy < B[3]) {
            ol = l;
            break;
          }
        }
        TK[c1] = 0;
        VC[c1] = 0;
        const oob = !F.in(tx, ty);
        if (oob && !F.out) {
          D[o] = 3;
          D[o + 1] = 4;
          D[o + 2] = 8;
          D[o + 3] = 255;
          G[o + 3] = 0;
          U[o] = 3;
          U[o + 1] = 4;
          U[o + 2] = 8;
          U[o + 3] = UA;
          GI[o + 3] = 0;
          SD[o] = 3;
          SD[o + 1] = 4;
          SD[o + 2] = 8;
          SD[o + 3] = 255;
          continue;
        }
        const i = oob ? -1 : ty * F.W + tx, t = oob ? T.VOID : F.t[i], inside = !oob && F.inside[i] && !(F.voidAt && F.voidAt(tx, ty));
        const vis = !oob && L.visF === F && L.vis[i];
        VC[c1] = vis ? GV && GV[i] && !DV[i] && inside ? 2 : 1 : 0;
        const dOut = dayO && !inside && !SX.homeOut.roofAt(F, tx, ty);
        if (env.hub) lum = inside ? .42 : dayO ? dOut ? .86 : .4 : night ? .4 : .62; else if (inside) lum = F.park ? .11 * (env.dim || 1) : (night ? .05 + F.win[i] * (nR ? .02 : .1) : .3 + F.win[i] * .55) * (env.dim || 1); else lum = night ? nR ? .06 : .24 : .92;
        if (t === T.VOID && F.kind !== "hub") lum *= F.idx > 0 ? .35 : .6;
        lum += flashB * (inside ? .25 : 1);
        for (const l of lights) {
          const dx = wx - l.x, dy = wy - l.y;
          const d2 = dx * dx + dy * dy;
          if (d2 > l.r * l.r) continue;
          const k = (1 - Math.sqrt(d2) / l.r) * (l.a || 1) * (l.flicker ? flick : 1);
          lum += k * .9;
          r += l.c[0] * k;
          g += l.c[1] * k;
          b += l.c[2] * k;
          if (l === ol) {
            oq = k * .9;
            oR = l.c[0] * k;
            oG = l.c[1] * k;
            oB = l.c[2] * k;
          }
        }
        let sl = 0;
        if (torch) {
          const dx = wx - torch.x, dy = wy - torch.y, d = Math.hypot(dx, dy);
          if (tOn) {
            if (nR) sl = snF(d) * SELF_N[1]; else if (d < SELF_ON[0]) sl = (1 - d / SELF_ON[0]) * SELF_ON[1];
            if (vis && d < TR && d > .2) {
              const dot = (dx * tCos + dy * tSin) / d;
              if (dot > TCUT) TK[c1] = Math.min(1, (dot - TCUT) / (TCUT2 - TCUT)) * Math.pow(1 - d / TR, .6);
              if (scK > 0 && d < SC_R && dot > SCUT) {
                const q = scK * sFall(d / SC_R) * sAngF(Math.acos(Math.min(1, dot)));
                TK[c1] = TK[c1] + q - TK[c1] * q;
              }
            }
          } else if (nR) sl = snF(d) * SELF_N[2]; else if (d < SELF_OFF[0]) sl = (1 - d / SELF_OFF[0]) * SELF_OFF[1];
        }
        if (vis) for (const q of oth) {
          const dx = wx - q.x, dy = wy - q.y, d = Math.hypot(dx, dy);
          if (nR) sl += snF(d) * SELF_N[3]; else if (d < SELF_PEER[0]) sl += (1 - d / SELF_PEER[0]) * SELF_PEER[1];
          if (d < TR && d > .3) {
            const dot = (dx * q.c + dy * q.s) / d;
            if (dot > TCUT && L.los(F, q.x, q.y, wx, wy)) lum += Math.min(1, (dot - TCUT) / (TCUT2 - TCUT)) * Math.pow(1 - d / TR, .6) * .8;
          }
        }
        const oX = lum - oq;
        let ls = lum + sl;
        if (env.nv) {
          lum = lum * 1.8 + .34;
          ls = ls * 1.8 + .34;
        }
        lum = Math.min(1.15, lum);
        ls = Math.min(1.15, ls);
        const a = Math.max(0, Math.min(.94, 1 - lum));
        if (night && !inside) {
          D[o] = 6;
          D[o + 1] = 10;
          D[o + 2] = 26;
        } else if (inside) {
          D[o] = 10;
          D[o + 1] = 8;
          D[o + 2] = 6;
        } else {
          D[o] = 8;
          D[o + 1] = 9;
          D[o + 2] = 14;
        }
        D[o + 3] = a * 255;
        SD[o] = D[o];
        SD[o + 1] = D[o + 1];
        SD[o + 2] = D[o + 2];
        SD[o + 3] = Math.max(0, Math.min(.94, 1 - ls)) * 255;
        if (SD[o + 3] !== D[o + 3]) selfDiff = true;
        U[o] = D[o];
        U[o + 1] = D[o + 1];
        U[o + 2] = D[o + 2];
        U[o + 3] = dOut ? UD : UA;
        GI[o] = D[o];
        GI[o + 1] = D[o + 1];
        GI[o + 2] = D[o + 2];
        GI[o + 3] = inside ? GA8 : 0;
        const gm = Math.min(90, (r + g + b) / 3 * .35);
        if (gm > 1) {
          const s = gm / Math.max(1, Math.max(r, g, b));
          G[o] = r * s;
          G[o + 1] = g * s;
          G[o + 2] = b * s;
          G[o + 3] = 255;
        } else G[o + 3] = 0;
        if (OD) {
          if (oq > 0) {
            const lx = Math.min(1.15, env.nv ? oX * 1.8 + .34 : oX), ax = Math.max(0, Math.min(.94, 1 - lx));
            OD[o] = D[o];
            OD[o + 1] = D[o + 1];
            OD[o + 2] = D[o + 2];
            OD[o + 3] = a < .94 ? (1 - (1 - ax) / (1 - a)) * 255 : 0;
            const r2 = r - oR, g2 = g - oG, b2 = b - oB, gx = Math.min(90, (r2 + g2 + b2) / 3 * .35);
            if (gx > 1) {
              const s2 = gx / Math.max(1, Math.max(r2, g2, b2));
              OG[o] = r2 * s2;
              OG[o + 1] = g2 * s2;
              OG[o + 2] = b2 * s2;
              OG[o + 3] = 255;
            }
          } else {
            OG[o] = G[o];
            OG[o + 1] = G[o + 1];
            OG[o + 2] = G[o + 2];
            OG[o + 3] = G[o + 3];
          }
        }
      }
    }
    dctx.putImageData(L.dImg, 0, 0);
    gctx.putImageData(L.gImg, 0, 0);
    utctx.putImageData(L.uImg, 0, 0);
    if (selfDiff) sdctx.putImageData(L.sImg, 0, 0);
    let OMb = null;
    if (OD) {
      odctx.putImageData(L.oImg, 0, 0);
      ogctx.putImageData(L.ogImg, 0, 0);
      const x0 = Math.max(0, Math.floor(OM.x0)), y0 = Math.max(0, Math.floor(OM.y0)), x1 = Math.min(vw, Math.ceil(OM.x1)), y1 = Math.min(vh, Math.ceil(OM.y1));
      if (x1 > x0 && y1 > y0) {
        OMb = [ x0, y0, x1 - x0, y1 - y0 ];
        if (!oq1 || oq1.width < OMb[2] || oq1.height < OMb[3]) {
          const W = Math.max(OMb[2], oq1 ? oq1.width : 0), H = Math.max(OMb[3], oq1 ? oq1.height : 0);
          oq1 = SX.art.mk(W, H);
          oq1x = oq1.getContext("2d");
          oq2 = SX.art.mk(W, H);
          oq2x = oq2.getContext("2d");
        }
      }
    }
    const ox = cx0 * HALF - cam.x, oy = cy0 * HALF - cam.y;
    const SF = L.self;
    L.self = null;
    const ownTo = c => {
      const x0 = OMb[0], y0 = OMb[1], w = OMb[2], h = OMb[3];
      oq1x.globalCompositeOperation = "source-over";
      oq1x.globalAlpha = 1;
      oq1x.clearRect(0, 0, w, h);
      oq1x.imageSmoothingEnabled = SM;
      oq1x.drawImage(odark, ox - x0, oy - y0, cw * HALF, ch * HALF);
      oq1x.globalCompositeOperation = "destination-in";
      oq1x.imageSmoothingEnabled = false;
      oq1x.drawImage(omc, x0, y0, w, h, 0, 0, w, h);
      oq1x.globalCompositeOperation = "source-over";
      const sm0 = c.imageSmoothingEnabled;
      c.imageSmoothingEnabled = false;
      c.drawImage(oq1, 0, 0, w, h, x0, y0, w, h);
      c.imageSmoothingEnabled = sm0;
    };
    const darkTo = (c, scene) => {
      darkTo1(c, scene);
      if (OMb) ownTo(c);
    };
    const darkTo1 = (c, scene) => {
      if (!selfDiff) {
        c.drawImage(dark, ox, oy, cw * HALF, ch * HALF);
        return;
      }
      if (!SF) {
        c.drawImage(sdark, ox, oy, cw * HALF, ch * HALF);
        return;
      }
      const x0 = SF.x0, y0 = SF.y0, w = SF.w, h = SF.h;
      if (scene) {
        c.save();
        c.beginPath();
        c.rect(0, 0, vw, vh);
        c.rect(x0, y0, w, h);
        c.clip("evenodd");
        c.drawImage(dark, ox, oy, cw * HALF, ch * HALF);
        c.restore();
      } else {
        c.drawImage(dark, ox, oy, cw * HALF, ch * HALF);
        c.clearRect(x0, y0, w, h);
      }
      if (!sq || sq.width < w || sq.height < h) {
        const W = Math.max(w, sq ? sq.width : 0), H = Math.max(h, sq ? sq.height : 0);
        sq = SX.art.mk(W, H);
        sqctx = sq.getContext("2d");
        sq2 = SX.art.mk(W, H);
        sq2ctx = sq2.getContext("2d");
      }
      for (const [q, src, op] of [ [ sqctx, sdark, "destination-in" ], [ sq2ctx, dark, "destination-out" ] ]) {
        q.globalCompositeOperation = "source-over";
        q.globalAlpha = 1;
        q.clearRect(0, 0, w, h);
        q.imageSmoothingEnabled = SM;
        q.drawImage(src, ox - x0, oy - y0, cw * HALF, ch * HALF);
        q.globalCompositeOperation = op;
        q.imageSmoothingEnabled = false;
        q.drawImage(SF.c, x0, y0, w, h, 0, 0, w, h);
      }
      sqctx.globalCompositeOperation = "lighter";
      sqctx.drawImage(sq2, 0, 0, w, h, 0, 0, w, h);
      sqctx.globalCompositeOperation = "source-over";
      c.drawImage(sq, 0, 0, w, h, x0, y0, w, h);
    };
    const pw = pm.width, ph = pm.height;
    const pqx = Math.floor(cam.x / PK) * PK, pqy = Math.floor(cam.y / PK) * PK, pdx = pqx - cam.x, pdy = pqy - cam.y;
    pmctx.setTransform(1, 0, 0, 1, 0, 0);
    pmctx.clearRect(0, 0, pw, ph);
    pmctx.setTransform(TS / PK, 0, 0, TS / PK, -pqx / PK, -pqy / PK);
    pmctx.fillStyle = "#fff";
    if (L.visF === F && L.polys) for (const P of L.polys) {
      if (P.length < 6) continue;
      pmctx.beginPath();
      pmctx.moveTo(P[0], P[1]);
      for (let k = 2; k < P.length; k += 2) pmctx.lineTo(P[k], P[k + 1]);
      pmctx.closePath();
      pmctx.fill();
    }
    pmctx.setTransform(1, 0, 0, 1, 0, 0);
    const QW = L.visF === F && L.quads ? L.quads : [];
    const quads = (c, which) => {
      c.fillStyle = "#fff";
      for (const q of QW) {
        const Q = q[which];
        if (!Q) continue;
        for (let k = 0; k < Q.length; k += 7) {
          const x0 = Q[k] * TS - cam.x, y0 = Q[k + 1] * TS - cam.y, x1 = Q[k + 2] * TS - cam.x, y1 = Q[k + 3] * TS - cam.y, fa = Q[k + 4], fb = Q[k + 5], vert = Q[k + 6];
          if (!fa && !fb || LQ) {
            c.fillStyle = "#fff";
            c.fillRect(x0, y0, x1 - x0, y1 - y0);
            continue;
          }
          const A0 = vert ? y0 : x0, A1 = vert ? y1 : x1, o = .04 * TS, n = .16 * TS, s0 = A0 - (fa ? o : 0), s1 = A1 + (fb ? o : 0), len = Math.max(1, s1 - s0);
          const g = vert ? c.createLinearGradient(0, s0, 0, s1) : c.createLinearGradient(s0, 0, s1, 0);
          const p0 = Math.min(.49, (fa ? o + n : 0) / len), p1 = Math.max(.51, 1 - (fb ? o + n : 0) / len);
          g.addColorStop(0, fa ? "rgba(255,255,255,0)" : "#fff");
          g.addColorStop(p0, "#fff");
          g.addColorStop(p1, "#fff");
          g.addColorStop(1, fb ? "rgba(255,255,255,0)" : "#fff");
          c.fillStyle = g;
          if (vert) c.fillRect(x0, s0, x1 - x0, len); else c.fillRect(s0, y0, len, y1 - y0);
        }
      }
    };
    unctx.globalCompositeOperation = "source-over";
    unctx.globalAlpha = 1;
    unctx.imageSmoothingEnabled = SM;
    unctx.clearRect(0, 0, vw, vh);
    unctx.drawImage(ut, ox, oy, cw * HALF, ch * HALF);
    unctx.globalCompositeOperation = "destination-out";
    unctx.drawImage(pm, 0, 0, pw, ph, pdx, pdy, pw * PK, ph * PK);
    quads(unctx, "s");
    const SP = seenProps(F, cam, vw, vh);
    for (const q of SP) {
      if (q.dk || q.fire) continue;
      if (q.ul) {
        if (q.ul.length) {
          unctx.save();
          clipR(unctx, q.ul);
          unctx.drawImage(q.c, q.x, q.y);
          unctx.restore();
        }
      } else unctx.drawImage(q.c, q.x, q.y);
    }
    if (L.room && L.room.F === F && L.room.any && rmc) {
      unctx.globalCompositeOperation = "destination-out";
      unctx.drawImage(rmc, 0, 0);
      rmtx.setTransform(1, 0, 0, 1, 0, 0);
      rmtx.globalCompositeOperation = "copy";
      rmtx.globalAlpha = 1;
      rmtx.drawImage(rmc, 0, 0);
      rmtx.globalCompositeOperation = "source-in";
      rmtx.imageSmoothingEnabled = SM;
      rmtx.drawImage(ut, ox, oy, cw * HALF, ch * HALF);
      const DQ = L.room.dd;
      if (DQ && DQ.length) {
        rmtx.save();
        rmtx.beginPath();
        for (let k = 0; k < DQ.length; k += 4) rmtx.rect(DQ[k], DQ[k + 1], DQ[k + 2] - DQ[k], DQ[k + 3] - DQ[k + 1]);
        rmtx.clip();
        rmtx.globalCompositeOperation = "destination-out";
        rmtx.fillStyle = "#000";
        rmtx.fillRect(0, 0, rmt.width, rmt.height);
        rmtx.globalCompositeOperation = "source-over";
        rmtx.drawImage(rmc, 0, 0);
        rmtx.globalCompositeOperation = "source-in";
        rmtx.fillStyle = "rgba(10,8,6," + (UA / 255).toFixed(3) + ")";
        rmtx.fillRect(0, 0, rmt.width, rmt.height);
        rmtx.restore();
      }
      if (L.room.lOn) {
        rmtx.globalCompositeOperation = "destination-out";
        rmtx.drawImage(rml, 0, 0);
      }
      rmtx.globalCompositeOperation = "source-over";
      unctx.globalCompositeOperation = "source-over";
      unctx.drawImage(rmt, 0, 0);
    }
    if (L.room && L.room.F === F && L.room.anyQ && rmq) {
      unctx.globalCompositeOperation = "destination-out";
      unctx.drawImage(rmq, 0, 0);
      rmtx.setTransform(1, 0, 0, 1, 0, 0);
      rmtx.globalCompositeOperation = "copy";
      rmtx.globalAlpha = 1;
      rmtx.drawImage(rmq, 0, 0);
      rmtx.globalCompositeOperation = "source-in";
      rmtx.imageSmoothingEnabled = SM;
      rmtx.drawImage(ut, ox, oy, cw * HALF, ch * HALF);
      const DQ = L.room.dd;
      if (DQ && DQ.length) {
        rmtx.save();
        rmtx.beginPath();
        for (let k = 0; k < DQ.length; k += 4) rmtx.rect(DQ[k], DQ[k + 1], DQ[k + 2] - DQ[k], DQ[k + 3] - DQ[k + 1]);
        rmtx.clip();
        rmtx.globalCompositeOperation = "destination-out";
        rmtx.fillStyle = "#000";
        rmtx.fillRect(0, 0, rmt.width, rmt.height);
        rmtx.globalCompositeOperation = "source-over";
        rmtx.drawImage(rmq, 0, 0);
        rmtx.globalCompositeOperation = "source-in";
        rmtx.fillStyle = "rgba(10,8,6," + (UA / 255).toFixed(3) + ")";
        rmtx.fillRect(0, 0, rmt.width, rmt.height);
        rmtx.restore();
      }
      rmtx.globalCompositeOperation = "destination-out";
      rmtx.drawImage(pm, 0, 0, pw, ph, pdx, pdy, pw * PK, ph * PK);
      rmtx.globalCompositeOperation = "source-over";
      unctx.globalCompositeOperation = "source-over";
      unctx.drawImage(rmt, 0, 0);
    }
    const GL = L.visF === F && L.glass && L.glass.length ? L.glass : null;
    if (GL) {
      gmctx.setTransform(1, 0, 0, 1, 0, 0);
      gmctx.clearRect(0, 0, pw, ph);
      gmctx.setTransform(TS / PK, 0, 0, TS / PK, -pqx / PK, -pqy / PK);
      gmctx.fillStyle = "#fff";
      gmctx.beginPath();
      for (const g of GL) for (let k = 0; k < g.length; k += 8) {
        gmctx.moveTo(g[k], g[k + 1]);
        gmctx.lineTo(g[k + 2], g[k + 3]);
        gmctx.lineTo(g[k + 4], g[k + 5]);
        gmctx.lineTo(g[k + 6], g[k + 7]);
        gmctx.closePath();
      }
      gmctx.fill();
      gmctx.setTransform(1, 0, 0, 1, 0, 0);
      gictx.putImageData(L.iImg, 0, 0);
      glctx.globalCompositeOperation = "source-over";
      glctx.globalAlpha = 1;
      glctx.imageSmoothingEnabled = SM;
      glctx.clearRect(0, 0, pw, ph);
      glctx.drawImage(gi, (ox - pdx) / PK, (oy - pdy) / PK, cw * HALF / PK, ch * HALF / PK);
      glctx.globalCompositeOperation = "destination-in";
      glctx.drawImage(gm, 0, 0);
    }
    L.glassOn = !!GL;
    ctx.save();
    ctx.imageSmoothingEnabled = SM;
    if (tOn && !(isFinite(torch.x) && isFinite(torch.y) && isFinite(tAng))) {
      darkTo(ctx, true);
    } else if (tOn) {
      const sx = torch.x * TS - cam.x + Math.cos(tAng) * 6, sy = torch.y * TS - cam.y + Math.sin(tAng) * 6, R = TR * TS;
      const lx = torch.x + Math.cos(tAng) * 6 / TS, ly = torch.y + Math.sin(tAng) * 6 / TS;
      cctx.setTransform(1, 0, 0, 1, 0, 0);
      cctx.globalCompositeOperation = "source-over";
      cctx.globalAlpha = 1;
      cctx.clearRect(0, 0, vw, vh);
      if (cctx.createConicGradient) {
        const gr = cctx.createRadialGradient(sx, sy, 0, sx, sy, R);
        for (let k = 0; k <= 12; k++) gr.addColorStop(k / 12, "rgba(255,238,200," + tFall(k / 12).toFixed(3) + ")");
        cctx.fillStyle = gr;
        cctx.beginPath();
        cctx.moveTo(sx, sy);
        cctx.arc(sx, sy, R, tAng - TOUT - .05, tAng + TOUT + .05);
        cctx.closePath();
        cctx.fill();
        const cg = cctx.createConicGradient(tAng - Math.PI, sx, sy);
        cg.addColorStop(0, "rgba(0,0,0,0)");
        cg.addColorStop(1, "rgba(0,0,0,0)");
        for (let k = 0; k <= 8; k++) {
          const h = T0 + (TOUT - T0) * k / 8, c = "rgba(0,0,0," + tAngF(h).toFixed(3) + ")";
          cg.addColorStop(.5 - h / TAU, c);
          cg.addColorStop(.5 + h / TAU, c);
        }
        cctx.globalCompositeOperation = "destination-in";
        cctx.fillStyle = cg;
        cctx.fillRect(Math.floor(sx - R), Math.floor(sy - R), Math.ceil(R * 2) + 1, Math.ceil(R * 2) + 1);
        if (scK > 0) {
          const SR = SC_R * TS, sg = mtctx.createRadialGradient(sx, sy, 0, sx, sy, SR);
          mtctx.setTransform(1, 0, 0, 1, 0, 0);
          mtctx.globalCompositeOperation = "source-over";
          mtctx.globalAlpha = 1;
          mtctx.clearRect(0, 0, vw, vh);
          for (let k = 0; k <= 8; k++) sg.addColorStop(k / 8, "rgba(255,238,200," + (scK * sFall(k / 8)).toFixed(3) + ")");
          mtctx.fillStyle = sg;
          mtctx.beginPath();
          mtctx.moveTo(sx, sy);
          mtctx.arc(sx, sy, SR, tAng - SC_A1 - .05, tAng + SC_A1 + .05);
          mtctx.closePath();
          mtctx.fill();
          const sc = mtctx.createConicGradient(tAng - Math.PI, sx, sy);
          sc.addColorStop(0, "rgba(0,0,0,0)");
          sc.addColorStop(1, "rgba(0,0,0,0)");
          for (let k = 0; k <= 8; k++) {
            const h = SC_A0 + (SC_A1 - SC_A0) * k / 8, c = "rgba(0,0,0," + sAngF(h).toFixed(3) + ")";
            sc.addColorStop(.5 - h / TAU, c);
            sc.addColorStop(.5 + h / TAU, c);
          }
          mtctx.globalCompositeOperation = "destination-in";
          mtctx.fillStyle = sc;
          mtctx.fillRect(Math.floor(sx - SR), Math.floor(sy - SR), Math.ceil(SR * 2) + 1, Math.ceil(SR * 2) + 1);
          mtctx.globalCompositeOperation = "source-over";
          cctx.globalCompositeOperation = "source-over";
          cctx.drawImage(mt, 0, 0);
        }
      } else {
        const gr = cctx.createRadialGradient(sx, sy, 0, sx, sy, R);
        gr.addColorStop(0, "rgba(255,238,200,1)");
        gr.addColorStop(.25, "rgba(255,238,200,0.86)");
        gr.addColorStop(.5, "rgba(255,238,200,0.68)");
        gr.addColorStop(.75, "rgba(255,238,200,0.42)");
        gr.addColorStop(1, "rgba(255,238,200,0)");
        cctx.fillStyle = gr;
        cctx.globalCompositeOperation = "lighter";
        const N = LQ ? 1 : 18;
        for (let k = 0; k < N; k++) {
          const h = N > 1 ? TIN * .85 + (TOUT - TIN * .85) * k / (N - 1) : (TIN * .85 + TOUT) / 2;
          cctx.globalAlpha = .97 / N;
          cctx.beginPath();
          cctx.moveTo(sx, sy);
          cctx.arc(sx, sy, R, tAng - h, tAng + h);
          cctx.closePath();
          cctx.fill();
        }
      }
      cctx.globalAlpha = 1;
      cctx.globalCompositeOperation = "destination-in";
      cctx.imageSmoothingEnabled = SM;
      mtctx.globalCompositeOperation = "source-over";
      mtctx.globalAlpha = 1;
      mtctx.imageSmoothingEnabled = SM;
      mtctx.clearRect(0, 0, vw, vh);
      mtctx.drawImage(pm, 0, 0, pw, ph, pdx, pdy, pw * PK, ph * PK);
      mtctx.globalCompositeOperation = "destination-out";
      mtctx.fillStyle = "#fff";
      CAPS.length = 0;
      const fT = 1 - (F.wallH || 24) / TS;
      {
        const tx0 = Math.max(0, Math.floor(cam.x / TS) - 1), tx1 = Math.min(F.W - 1, Math.ceil((cam.x + vw) / TS) + 1), ty0 = Math.max(0, Math.floor(cam.y / TS) - 1), ty1 = Math.min(F.H - 2, Math.ceil((cam.y + vh) / TS) + 1);
        const wl = (x, y) => {
          const t = F.t[y * F.W + x];
          return t !== T.VOID && (F.opaqueTile(x, y) || t === T.WINDOW);
        };
        for (let y = ty0; y <= ty1; y++) {
          let run = -1;
          for (let x = tx0; x <= tx1 + 1; x++) {
            const cap = x <= tx1 && wl(x, y) && !wl(x, y + 1);
            if (cap && run < 0) run = x; else if (!cap && run >= 0) {
              mtctx.fillRect(run * TS - cam.x, (y - .75) * TS - cam.y, (x - run) * TS, (fT + .75) * TS);
              CAPS.push(run, y - .75, x, y + fT);
              run = -1;
            }
          }
        }
      }
      mtctx.globalCompositeOperation = "source-over";
      cctx.drawImage(mt, 0, 0);
      ND = SX.normal ? SX.normal.use(D, cw, ch, cx0, cy0, torch) : null;
      if (ND && !LQ) ND.floor(cctx, F, cam, sx, sy, tAng, R, TOUT);
      litObjects(F, cam, QW, SP, lx, ly, tCos, tSin, torch, LQ, sx, sy, tAng);
      if (ND) ND.bodies(cctx, cam, lx, ly, sx, sy, R);
      ND = null;
      octx.globalCompositeOperation = "source-over";
      octx.globalAlpha = 1;
      octx.imageSmoothingEnabled = SM;
      octx.clearRect(0, 0, vw, vh);
      darkTo(octx, false);
      octx.globalCompositeOperation = "destination-out";
      octx.drawImage(cone, 0, 0);
      ctx.drawImage(ov, 0, 0);
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = .12;
      ctx.drawImage(cone, 0, 0);
    } else darkTo(ctx, true);
    if (GL) {
      unctx.globalCompositeOperation = "source-over";
      unctx.drawImage(gl, 0, 0, pw, ph, pdx, pdy, pw * PK, ph * PK);
      unctx.globalCompositeOperation = "destination-out";
      quads(unctx, "s");
      if (tOn) unctx.drawImage(cone, 0, 0);
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.drawImage(un, 0, 0);
    if (!LQ) {
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = .55;
      if (!OMb) ctx.drawImage(glow, ox, oy, cw * HALF, ch * HALF); else {
        const x0 = OMb[0], y0 = OMb[1], w = OMb[2], h = OMb[3];
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, vw, vh);
        ctx.rect(x0, y0, w, h);
        ctx.clip("evenodd");
        ctx.drawImage(glow, ox, oy, cw * HALF, ch * HALF);
        ctx.restore();
        for (const [q, src, op] of [ [ oq1x, glow, "destination-out" ], [ oq2x, oglow, "destination-in" ] ]) {
          q.globalCompositeOperation = "source-over";
          q.globalAlpha = 1;
          q.clearRect(0, 0, w, h);
          q.imageSmoothingEnabled = SM;
          q.drawImage(src, ox - x0, oy - y0, cw * HALF, ch * HALF);
          q.globalCompositeOperation = op;
          q.imageSmoothingEnabled = false;
          q.drawImage(omc, x0, y0, w, h, 0, 0, w, h);
          q.globalCompositeOperation = "source-over";
        }
        oq1x.globalCompositeOperation = "lighter";
        oq1x.drawImage(oq2, 0, 0, w, h, 0, 0, w, h);
        oq1x.globalCompositeOperation = "source-over";
        ctx.drawImage(oq1, 0, 0, w, h, x0, y0, w, h);
      }
    }
    ctx.restore();
    ctx.imageSmoothingEnabled = false;
    if (gas && gas.level > 0) drawGas(ctx, vw, vh, gas);
    if (gas && gas.smoke > 0) drawSmoke(ctx, vw, vh, Math.min(1, gas.smoke));
    if (gas && gas.dive > 0) drawDive(ctx, cam, vw, vh, gas);
  };
  L.brightAt = function(cam, x, y) {
    if (!L.dImg) return 1;
    const cx0 = Math.floor(cam.x / HALF) - 1, cy0 = Math.floor(cam.y / HALF) - 1;
    const cx = Math.floor(x * 2) - cx0, cy = Math.floor(y * 2) - cy0, cw = L.dImg.width;
    if (cx < 0 || cy < 0 || cx >= cw || cy >= L.dImg.height) return 0;
    const c1 = cy * cw + cx;
    const v = L.vc ? L.vc[c1] : 1, b = (1 - (L.sImg || L.dImg).data[c1 * 4 + 3] / 255) * (v === 0 ? L.unF || .32 : v === 2 ? 1 - (L.glA || .6) : 1);
    return Math.min(1, b + (L.tk ? L.tk[c1] : 0));
  };
  const gasCv = SX.art.mk(8, 8), gasCtx = gasCv.getContext("2d");
  const GAS_K = 6;
  function drawSmoke(ctx, vw, vh, s) {
    const t = performance.now() / 1e3;
    const w = Math.ceil(vw / GAS_K) + 2, h = Math.ceil(vh / GAS_K) + 2;
    if (gasCv.width !== w || gasCv.height !== h) {
      gasCv.width = w;
      gasCv.height = h;
    }
    gasCtx.clearRect(0, 0, w, h);
    for (let k = 0; k < 30; k++) {
      const sp = 2 + k % 5 * 1.2, x = (k * 61.7 + t * sp) % (w + 36) - 18, y = (k * 37.3 + Math.sin(t * .18 + k) * 6) % (h + 24) - 12, r = 6 + k % 5 * 3;
      const g = gasCtx.createRadialGradient(x, y, 0, x, y, r), a = .22 + k % 3 * .08, c = k % 2 ? "34,32,30" : "86,82,78";
      g.addColorStop(0, "rgba(" + c + "," + a + ")");
      g.addColorStop(1, "rgba(" + c + ",0)");
      gasCtx.fillStyle = g;
      gasCtx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    ctx.save();
    ctx.globalAlpha = Math.min(.58, s * .62);
    ctx.fillStyle = "#24211d";
    ctx.fillRect(0, 0, vw, vh);
    ctx.globalAlpha = Math.min(.85, .2 + s * .65);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(gasCv, 0, 0, w, h, -GAS_K, -GAS_K, w * GAS_K, h * GAS_K);
    ctx.restore();
  }
  function drawDive(ctx, cam, vw, vh, g) {
    const t = performance.now() / 1e3, cx = g.dx != null ? g.dx * TS - cam.x : vw / 2, cy = g.dy != null ? (g.dy - .6) * TS - cam.y : vh / 2;
    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.fillStyle = "rgba(12,30,30,0.45)";
    ctx.fillRect(0, 0, vw, vh);
    const gr = ctx.createRadialGradient(cx, cy, TS * 1.6, cx, cy, TS * 4.4);
    gr.addColorStop(0, "rgba(6,17,18,0)");
    gr.addColorStop(1, "rgba(6,17,18,0.94)");
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, vw, vh);
    ctx.globalCompositeOperation = "lighter";
    for (let k = 0; k < 7; k++) {
      const x = (k * 271 + t * (9 + k * 2)) % (vw + 200) - 100, w = 18 + k % 3 * 14;
      ctx.fillStyle = "rgba(70,110,100," + (.035 + .02 * Math.sin(t * 1.3 + k)).toFixed(3) + ")";
      ctx.fillRect(Math.round(x), 0, w, vh);
    }
    ctx.restore();
  }
  function drawGas(ctx, vw, vh, gas) {
    const t = performance.now() / 1e3, lv = Math.min(1, gas.level);
    const w = Math.ceil(vw / GAS_K) + 2, h = Math.ceil(vh / GAS_K) + 2;
    if (gasCv.width !== w || gasCv.height !== h) {
      gasCv.width = w;
      gasCv.height = h;
    }
    gasCtx.clearRect(0, 0, w, h);
    gasCtx.globalCompositeOperation = "lighter";
    for (let k = 0; k < 26; k++) {
      const sp = 3 + k % 5 * 1.6;
      const x = (k * 73.3 + t * sp) % (w + 30) - 15;
      const y = (k * 41.7 + Math.sin(t * .22 + k) * 5) % (h + 18) - 9;
      const r = 4 + k % 5 * 2.5;
      const g = gasCtx.createRadialGradient(x, y, 0, x, y, r);
      const a = .16 + k % 3 * .05;
      g.addColorStop(0, "rgba(168,206,104," + a + ")");
      g.addColorStop(.55, "rgba(140,182,84," + (a * .45).toFixed(3) + ")");
      g.addColorStop(1, "rgba(140,182,84,0)");
      gasCtx.fillStyle = g;
      gasCtx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    gasCtx.globalCompositeOperation = "source-over";
    ctx.save();
    ctx.globalAlpha = Math.min(.26, lv * .42);
    ctx.fillStyle = "#54702f";
    ctx.fillRect(0, 0, vw, vh);
    ctx.globalAlpha = Math.min(.5, .2 + lv * .4);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(gasCv, 0, 0, w, h, -GAS_K, -GAS_K, w * GAS_K, h * GAS_K);
    ctx.globalAlpha = Math.min(.5, lv * .7);
    ctx.fillStyle = "#cfe89a";
    for (let k = 0; k < 40; k++) {
      const x = (k * 137.5 + t * (9 + k % 4 * 5)) % (vw + 40) - 20;
      const y = (k * 89.1 + Math.sin(t * .8 + k) * 7) % (vh + 20) - 10;
      ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
    }
    ctx.restore();
  }
  const drops = [];
  L.rain = function(ctx, vw, vh, amount, dt, cam, outside, storm) {
    if (amount <= 0) return;
    const want = Math.floor(vw * vh / 2600 * amount * (storm ? 1.5 : 1));
    while (drops.length < want) drops.push({
      x: Math.random() * (vw + 80),
      y: Math.random() * vh,
      v: 440 + Math.random() * 180,
      l: 10 + Math.random() * 10,
      s: 0
    });
    drops.length = Math.min(drops.length, want);
    const sl = storm ? .62 + Math.sin(performance.now() / 900) * .18 : .28, vk = storm ? 1.35 : 1;
    ctx.save();
    ctx.strokeStyle = outside ? "rgba(190,205,225,0.32)" : "rgba(190,205,225,0.08)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (const d of drops) {
      d.y += d.v * vk * dt;
      d.x -= d.v * vk * dt * sl;
      if (d.y > vh || d.x < -20) {
        if (outside && Math.random() < .5) splash.push({
          x: d.x,
          y: d.y - Math.random() * vh * .2,
          t: .12
        });
        d.y = -20 - Math.random() * 60;
        d.x = Math.random() * (vw + 80);
      }
      const x = Math.round(d.x), y = Math.round(d.y);
      ctx.moveTo(x + .5, y);
      ctx.lineTo(x + .5 - d.l * sl, y + d.l);
    }
    ctx.stroke();
    ctx.fillStyle = "rgba(200,215,235,0.35)";
    for (let i = splash.length - 1; i >= 0; i--) {
      const s = splash[i];
      s.t -= dt;
      if (s.t <= 0) {
        splash.splice(i, 1);
        continue;
      }
      ctx.fillRect(Math.round(s.x) - 3, Math.round(s.y) - 1, 2, 1);
      ctx.fillRect(Math.round(s.x) + 2, Math.round(s.y) - 1, 2, 1);
      ctx.fillRect(Math.round(s.x) - 1, Math.round(s.y), 3, 1);
    }
    ctx.restore();
  };
  const splash = [];
  L.vignette = function(ctx, vw, vh, hurt, low) {
    const a = Math.max(hurt, low);
    if (a <= .01) return;
    ctx.save();
    const g = ctx.createRadialGradient(vw / 2, vh / 2, Math.min(vw, vh) * .32, vw / 2, vh / 2, Math.max(vw, vh) * .62);
    g.addColorStop(0, "rgba(160,0,0,0)");
    g.addColorStop(1, "rgba(170,10,15," + Math.min(.85, a) + ")");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, vw, vh);
    ctx.fillStyle = "rgba(140,0,10," + Math.min(.9, a) + ")";
    const e = Math.round(6 + a * 16);
    for (let x = 0; x < vw; x += 8) {
      const h = e + x * 7 % 10;
      ctx.fillRect(x, 0, 8, h);
      ctx.fillRect(x, vh - h, 8, h);
    }
    for (let y = 0; y < vh; y += 8) {
      const w = e + y * 5 % 10;
      ctx.fillRect(0, y, w, 8);
      ctx.fillRect(vw - w, y, w, 8);
    }
    ctx.restore();
  };
})(window.SX);
