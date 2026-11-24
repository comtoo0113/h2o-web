"use strict";

(function(SX) {
  const A = SX.art, RP = A.ramp, TS = SX.TS || 32;
  const FS = SX.fanSpin = {
    KINDS: {
      fan: 1
    },
    N: 4,
    FPS: 14,
    on: true,
    ph: null,
    RANGE: 4,
    VOL: .12,
    MAXN: 3,
    STOP: .8,
    LED_OFF: "#3a4840"
  };
  FS.time = () => Date.now() % 864e6 / 1e3;
  const H = SX.home, FURN = H && H.FURN, live = f => H && H.live ? H.live(f) : f;
  if (FURN && FURN.fan && !FURN.fan.use) FURN.fan.use = "fan";
  const fidOf = p => p.furn && p.furn.id != null ? p.furn.id : Math.round(p.x * 7 + p.y * 131);
  FS.isOn = p => {
    const f = p && p.furn ? live(p.furn) : null;
    return !f || !f.off;
  };
  FS.running = p => !!p && FS.isOn(p);
  const spin = new Map;
  const placeKey = () => {
    const Hb = SX.hub, V = SX.visit;
    if (!Hb) return null;
    if (Hb.scene === "home") return "home";
    if (Hb.scene === "visit" && V && V.cur) return "v" + V.cur.owner;
    return null;
  };
  const phaseOn = (p, t) => t * FS.FPS + fidOf(p) * 7 % FS.N;
  function stateOf(p, t) {
    const id = (placeKey() || "x") + ":" + fidOf(p), on = FS.isOn(p);
    let s = spin.get(id);
    if (!s) {
      s = {
        on,
        t0: -1e9
      };
      spin.set(id, s);
      return s;
    }
    if (s.on !== on) {
      s.on = on;
      if (!on) {
        const ph0 = phaseOn(p, t), stop = FS.N * Math.ceil((ph0 + FS.FPS * FS.STOP / 3.2) / FS.N);
        s.t0 = t;
        s.ph0 = ph0;
        s.D = stop - ph0;
        s.k = FS.FPS * FS.STOP / s.D;
      }
    }
    return s;
  }
  FS.phase = function(p, t) {
    const s = stateOf(p, t);
    if (s.on) return phaseOn(p, t);
    const u = (t - s.t0) / FS.STOP;
    return u < 0 || u >= 1 ? null : s.ph0 + s.D * (1 - Math.pow(1 - u, s.k));
  };
  FS.frame = (p, t) => {
    const ph = FS.phase(p, t);
    if (ph == null) return -1;
    const k = Math.floor(ph);
    return (k % FS.N + FS.N) % FS.N;
  };
  const W = RP("#d8dce0"), DARK = "#2a2e34", SIDE = "#3a3e44", BLUR = A.mix(DARK, W[2], .42), BLUR_S = A.mix(W[3], W[4], .5), TRAIL = .42;
  const TAU = Math.PI * 2;
  function disc(P, F, ph, back) {
    const cx = F.x + Math.round(F.w / 2), cy = F.y + Math.round(F.h / 2), r = Math.max(3, Math.min(Math.round(F.w / 2), Math.round(F.h / 2)) - 1), L = r - 1;
    P.oval(cx, cy, r + 1, r + 1, W[1]).oval(cx, cy, r, r, DARK);
    const a0 = .4 + ph * TAU / 3, at = a => back ? Math.PI - a : a, end = (a, l) => [ Math.round(cx + Math.cos(at(a)) * l), Math.round(cy + Math.sin(at(a)) * l) ];
    for (let k = 0; k < 3; k++) {
      const [x, y] = end(a0 + k * TAU / 3 - TRAIL, L);
      P.thick(cx, cy, x, y, 2, BLUR);
    }
    for (let k = 0; k < 3; k++) {
      const [x, y] = end(a0 + k * TAU / 3, L);
      P.thick(cx, cy, x, y, 2, W[4]);
    }
    if (back) P.oval(cx, cy, Math.max(1, Math.round(r / 2)), Math.max(1, Math.round(r / 2)), W[2]);
    P.ring(cx, cy, r, r, W[4]);
    for (let a = 0; a < 6.283; a += .7) P.line(cx, cy, Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r), "rgba(216,220,224,0.3)");
    P.oval(cx, cy, 2, 2, W[4]).p(cx - 1, cy - 1, W[5]);
  }
  function edge(P, F, ph) {
    const cx = F.x + Math.round(F.w / 2), cy = F.y + Math.round(F.h / 2), rx = Math.max(2, Math.round(F.w / 2)), ry = Math.max(3, Math.round(F.h / 2) - 1), L = ry - 1;
    P.oval(cx, cy, rx, ry, W[2]).oval(cx, cy, Math.max(1, rx - 1), Math.max(1, ry - 1), SIDE);
    P.r(cx - 1, F.y + 1, 2, F.h - 2, W[3]);
    const a0 = .4 + ph * TAU / 3, seg = (a, c) => {
      const y1 = cy + Math.round(Math.sin(a) * L), y0 = Math.min(cy, y1), h = Math.abs(y1 - cy) + 1;
      P.r(cx - 1, y0, 2, h, c);
    };
    for (let k = 0; k < 3; k++) seg(a0 + k * TAU / 3 - TRAIL, BLUR_S);
    const bl = [ 0, 1, 2 ].map(k => a0 + k * TAU / 3).sort((a, b) => Math.cos(a) - Math.cos(b));
    for (const a of bl) seg(a, Math.cos(a) > .2 ? W[5] : W[4]);
    P.r(cx - 1, cy - 1, 2, 2, W[4]).p(cx - 1, cy - 1, W[5]);
  }
  const M = A.rotModel && A.rotModel("fan"), G = M && M.parts.find(q => q.skipBox);
  if (G && !G._spin) {
    const f0 = G.f, b0 = G.b, s0 = G.s;
    G._spin = true;
    G.f = function(P, F) {
      return FS.ph == null ? f0.apply(this, arguments) : disc(P, F, FS.ph, false);
    };
    G.b = function(P, F) {
      return FS.ph == null ? b0.apply(this, arguments) : disc(P, F, FS.ph, true);
    };
    G.s = function(P, F) {
      return FS.ph == null ? s0.apply(this, arguments) : edge(P, F, FS.ph);
    };
  }
  const sets = new Map;
  function frameImg(kind, v, col, rot, k) {
    const d = A.propDef(kind);
    if (!d) return null;
    const dm = A.propDims(kind, rot), w = dm.fw * TS, h = dm.fh * TS + dm.up, own = rot === 0 ? d.draw : d.rotDraw && d.rotDraw[rot];
    if (!own) return null;
    return A.cached("fanSpin:" + kind + ":" + v + ":" + (col || "") + ":" + rot + ":" + k + "/" + FS.N, w, h, P => {
      FS.ph = k / FS.N;
      try {
        own(P, w, h, dm.up, new SX.Rng(v * 131 + kind.length), v, col || d.color, rot);
      } finally {
        FS.ph = null;
      }
    }, d.outline ? {
      mat: true
    } : null);
  }
  function setOf(kind, v, col, rot, base) {
    const key = kind + ":" + v + ":" + (col || "") + ":" + rot + "/" + FS.N;
    let S = sets.get(key);
    if (S && S.base === base) return S;
    const none = {
      base,
      x: 0,
      y: 0,
      w: 0,
      h: 0,
      list: [],
      n: 0,
      semi: 0
    };
    const fr = [];
    for (let k = 0; k < FS.N; k++) {
      const c = frameImg(kind, v, col, rot, k);
      if (!c || c.width !== base.width || c.height !== base.height) {
        sets.set(key, none);
        return none;
      }
      fr.push(c);
    }
    const w = base.width, h = base.height, b = base.getContext("2d").getImageData(0, 0, w, h).data, fd = fr.map(c => c.getContext("2d").getImageData(0, 0, w, h).data);
    const mask = new Uint8Array(w * h);
    let x0 = w, y0 = h, x1 = -1, y1 = -1, n = 0, semi = 0;
    for (let i = 0; i < w * h; i++) {
      const o = i * 4;
      let diff = false;
      for (const d of fd) if (d[o] !== b[o] || d[o + 1] !== b[o + 1] || d[o + 2] !== b[o + 2] || d[o + 3] !== b[o + 3]) {
        diff = true;
        break;
      }
      if (!diff) continue;
      mask[i] = 1;
      n++;
      const x = i % w, y = i / w | 0;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
      for (const d of fd) if (d[o + 3] !== 255) {
        semi++;
        break;
      }
    }
    if (!n) {
      sets.set(key, none);
      return none;
    }
    const pw = x1 - x0 + 1, ph = y1 - y0 + 1, list = fd.map(d => {
      const c = A.mk(pw, ph), x = c.getContext("2d"), im = x.createImageData(pw, ph), q = im.data;
      for (let yy = 0; yy < ph; yy++) for (let xx = 0; xx < pw; xx++) {
        const i = (y0 + yy) * w + x0 + xx;
        if (!mask[i]) continue;
        const o = i * 4, t = (yy * pw + xx) * 4;
        q[t] = d[o];
        q[t + 1] = d[o + 1];
        q[t + 2] = d[o + 2];
        q[t + 3] = d[o + 3];
      }
      x.putImageData(im, 0, 0);
      return c;
    });
    S = {
      base,
      x: x0,
      y: y0,
      w: pw,
      h: ph,
      list,
      n,
      semi
    };
    sets.set(key, S);
    return S;
  }
  FS.setOf = setOf;
  const modC = new WeakMap;
  function modded(c) {
    const Mo = SX.mods;
    if (!Mo || !Mo.tex || !Mo.tex.length) return false;
    const r = modC.get(c);
    if (r && r.n === Mo.tex.length) return r.v;
    const k = A.keyOf && A.keyOf(c), v = !!k && Mo.tex.some(t => t.exact ? t.pat === k : t.re && t.re.test(k));
    modC.set(c, {
      n: Mo.tex.length,
      v
    });
    return v;
  }
  const ents = new WeakMap;
  FS.entry = p => ents.get(p) || null;
  const ledC = new WeakMap;
  function ledOf(c) {
    if (ledC.has(c)) return ledC.get(c);
    let at = null;
    const w = c.width, h = c.height, d = c.getContext("2d").getImageData(0, 0, w, h).data;
    for (let i = 0; i < w * h && !at; i++) {
      const o = i * 4;
      if (d[o + 3] === 255 && d[o + 1] > 170 && d[o] < 140 && d[o + 2] < 160 && d[o + 1] - d[o] > 80) at = [ i % w, i / w | 0 ];
    }
    ledC.set(c, at);
    return at;
  }
  FS.ledOf = ledOf;
  FS.draw = function(ctx, p, s, x, y, now) {
    if (!FS.on || !p || p.lift || !s || !s.c || ctx.globalCompositeOperation === "destination-out") return;
    const rot = A.noRot(p.kind) ? 0 : (p.rot | 0) & 3, v = p.v | 0, col = p.col || null;
    let e = ents.get(p);
    if (!e || e.src !== s.c || e.rot !== rot || e.v !== v || e.col !== col) {
      if (modded(s.c)) return;
      const S = setOf(p.kind, v, col, rot, s.c);
      if (!S || !S.list.length) return;
      e = {
        src: s.c,
        rot,
        v,
        col,
        S,
        k: -1
      };
      ents.set(p, e);
    } else if (SX.mods && SX.mods.tex && SX.mods.tex.length && modded(s.c)) return;
    if (!FS.isOn(p) && rot === 0) {
      const L = ledOf(s.c);
      if (L) {
        ctx.fillStyle = FS.LED_OFF;
        ctx.fillRect(x + L[0], y + L[1], 1, 1);
      }
    }
    const S = e.S, f0 = FS.frame(p, FS.time());
    e.k = f0;
    if (f0 < 0) return;
    const k = f0 % S.list.length;
    ctx.drawImage(S.list[k], x + S.x, y + S.y);
    if (p.hl) {
      ctx.save();
      ctx.globalAlpha = .22 + Math.sin(now * 6) * .08;
      ctx.globalCompositeOperation = "lighter";
      ctx.drawImage(S.list[k], x + S.x, y + S.y);
      ctx.restore();
    }
  };
  const nets = new Map;
  const netOf = k => {
    let m = nets.get(k);
    if (!m) {
      m = new Map;
      nets.set(k, m);
    }
    return m;
  };
  function setOn(p, f, on, quiet) {
    if (on) delete f.off; else f.off = 1;
    stateOf(p, FS.time());
    if (!quiet && SX.audio) SX.audio.play("fanSwitch", {
      x: p.x + p.w / 2,
      y: p.y + p.h / 2,
      vol: .8
    });
    const F = SX.hub && SX.hub.floor ? SX.hub.floor() : null;
    if (F && SX.homeUse && SX.homeUse.labels) SX.homeUse.labels(F);
    if (SX.hub && SX.hub.scene === "home" && SX.game && SX.game.persist) SX.game.persist();
  }
  FS.toggle = function(prop, f) {
    if (!prop) return;
    f = f || (prop.furn ? live(prop.furn) : null);
    if (!f) return;
    const on = !!f.off, k = placeKey();
    if (k && f.id != null) {
      const m = netOf(k), q = m.get(f.id) || {
        n: 0,
        on: !on
      };
      q.n++;
      q.on = on;
      m.set(f.id, q);
    }
    setOn(prop, f, on, false);
  };
  FS.mark = function(f, on) {
    const k = placeKey();
    if (!k || !f || f.id == null) return;
    const m = netOf(k), q = m.get(f.id) || {
      n: 0,
      on: !on
    };
    q.n++;
    q.on = !!on;
    m.delete(f.id);
    m.set(f.id, q);
  };
  FS.netSt = function() {
    const k = placeKey();
    if (!k) return null;
    const m = nets.get(k);
    if (!m || !m.size) return null;
    const out = [];
    for (const [id, q] of m) if (q.n > 0) out.push([ id, q.on ? 1 : 0, q.n ]);
    return out.length ? out.slice(-12) : null;
  };
  function netIn(F) {
    const Mt = SX.meet, k = placeKey();
    if (!Mt || !Mt.seen || !k) return;
    let gs;
    try {
      gs = Mt.seen();
    } catch (e) {
      return;
    }
    const m = netOf(k);
    for (const g of gs) {
      if (!Array.isArray(g.fo)) continue;
      for (const r of g.fo) {
        if (!Array.isArray(r)) continue;
        const id = +r[0], on = !!r[1], n = +r[2] | 0;
        if (!(n > 0)) continue;
        const q = m.get(id);
        if (q && !(n > q.n || n === q.n && q.on && !on)) continue;
        m.set(id, {
          n,
          on
        });
        const p = F.props.find(x => FS.KINDS[x.kind] && x.furn && x.furn.id === id);
        if (!p) {
          if (SX.homeUse && SX.homeUse.netLight) SX.homeUse.netLight(F, id, on);
          continue;
        }
        const f = live(p.furn);
        if (!f || !f.off === on) continue;
        setOn(p, f, on, false);
      }
    }
  }
  FS.netIn = netIn;
  FS.tick = function(F) {
    if (F && F.props) netIn(F);
    const S = SX.audio;
    if (!FS.on || !S || !S.spotLoop || !F || !F.props) return;
    const Ls = S.listener, near = [];
    for (const p of F.props) {
      if (!FS.KINDS[p.kind] || !p.furn || p.lift || !FS.running(p)) continue;
      const x = p.x + p.w / 2, y = p.y + p.h / 2, d = Math.hypot(x - Ls.x, y - Ls.y);
      if (d >= FS.RANGE) continue;
      near.push([ d, p, x, y ]);
    }
    near.sort((a, b) => a[0] - b[0]);
    for (let i = 0; i < near.length && i < FS.MAXN; i++) {
      const q = near[i];
      S.spotLoop("fan" + fidOf(q[1]), "fanHum", {
        x: q[2],
        y: q[3],
        range: FS.RANGE,
        vol: FS.VOL
      });
    }
  };
})(window.SX);
