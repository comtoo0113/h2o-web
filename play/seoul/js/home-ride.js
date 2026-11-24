"use strict";

(function(SX) {
  const R = SX.ride = {};
  R.KINDS = {
    waterCooler: 1
  };
  R.HOSTS = {
    table: 1,
    diningTable: 1,
    desk: 1,
    coffeeTable: 1,
    counter: 1,
    prepCounter: 1,
    cupboard: 1,
    workbench: 1,
    nightstand: 1,
    dresser: 1,
    cabinet: 1,
    crate: 1
  };
  R.isOn = f => !!(f && R.KINDS[f.kind] && f.on && typeof f.on === "object");
  R.tidy = function(h, sel) {
    if (!h || !Array.isArray(h.furn)) return 0;
    let n = 0;
    const isSel = q => !!sel && (q === sel || q.id === sel.id && q.kind === sel.kind);
    for (const f of h.furn) {
      if (!f || f.on == null) continue;
      if (!R.KINDS[f.kind] || typeof f.on !== "object") {
        delete f.on;
        continue;
      }
      if (!f.placed) {
        if (!isSel(f)) delete f.on;
        continue;
      }
      const hf = h.furn.find(q => q && q.id === f.on.id && !R.KINDS[q.kind]);
      if (!hf || !R.HOSTS[hf.kind] || !hf.placed && !isSel(hf)) {
        f.placed = false;
        delete f.on;
        n++;
      }
    }
    return n;
  };
  if (!SX.home || !SX.art || !SX.top) return;
  const H = SX.home, A = SX.art, T = SX.top, TS = 32;
  const curF = () => SX.hub && SX.hub.scene === "home" && SX.hub.level ? SX.hub.floor() : null;
  const sprOf = f => (A.propBase || A.prop)(f.kind, f.v | 0, f.col || null, f.rot | 0);
  const boxes = new Map;
  function boxOf(s) {
    let b = boxes.get(s.c);
    if (b) return b;
    const w = s.c.width, h = s.c.height, d = s.c.getContext("2d").getImageData(0, 0, w, h).data;
    let x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let i = 0; i < w * h; i++) {
      if (d[i * 4 + 3] < 200) continue;
      const x = i % w, y = i / w | 0;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
    b = x1 < 0 ? {
      x0: 0,
      y0: 0,
      x1: w - 1,
      y1: h - 1
    } : {
      x0,
      y0,
      x1,
      y1
    };
    b.ax = Math.round((b.x0 + b.x1) / 2);
    b.ay = b.y1;
    b.w = b.x1 - b.x0 + 1;
    boxes.set(s.c, b);
    return b;
  }
  const spotCache = new Map;
  R.spots = function(hk, hrot, rk, rrot) {
    const key = hk + ":" + ((hrot | 0) & 3) + ":" + rk + ":" + ((rrot | 0) & 3);
    if (spotCache.has(key)) return spotCache.get(key);
    const g = T.geom(hk, hrot), sl = T.slots(hk, hrot), rs = A.prop(rk, 0, null, rrot | 0);
    let out = [];
    if (R.HOSTS[hk] && g && rs && sl.length) {
      const b = boxOf(rs), t = g.top;
      if (b.w <= t.w + 4 && t.d >= 6) {
        const lo = t.x - 1 + (b.ax - b.x0), hi = t.x + t.w - (b.x1 - b.ax), ylo = t.y + Math.min(5, t.d - 2), yhi = t.y + t.d - 2;
        out = sl.map(s => {
          const x = hi < lo ? Math.round((lo + hi) / 2) : Math.max(lo, Math.min(hi, s.x)), y = Math.max(ylo, Math.min(yhi, s.y));
          const rx = x - b.ax + b.x0, ry = y - b.ay + b.y0, rw = b.w, rh = b.y1 - b.y0 + 1;
          for (const o of g.occ || []) {
            if (o.p.y + o.p.d <= s.dep + .02) continue;
            const c = o.rc;
            if (c.x < rx + rw && c.x + c.w > rx && c.y < ry + rh && c.y + c.h > ry) return null;
          }
          return {
            x,
            y,
            dep: s.dep,
            hw: Math.ceil(b.w / 2)
          };
        });
      }
    }
    spotCache.set(key, out);
    return out;
  };
  R.posOf = function(hp, f, sp) {
    const hs = A.prop(hp.kind, hp.v | 0, hp.col || null, hp.rot | 0), rs = A.prop(f.kind, f.v | 0, f.col || null, f.rot | 0);
    if (!hs || !rs) return null;
    const b = boxOf(rs), hx = hp.px != null ? hp.px : hp.x, hy = hp.py != null ? hp.py : hp.y;
    return {
      x: hx + (sp.x - b.ax) / TS,
      y: hy + (hs.oy + sp.y - b.ay - rs.oy) / TS
    };
  };
  const covers = (sp, q) => Math.abs(q.x - sp.x) <= sp.hw + 1 && q.y >= sp.y - 10 && q.y <= sp.y + 3;
  const ridersOf = hf => {
    const h = H.save();
    return h && hf ? h.furn.filter(q => R.isOn(q) && q.on.id === hf.id && q !== hf) : [];
  };
  R.blocked = function(hf) {
    const out = [];
    if (!hf || !R.HOSTS[hf.kind]) return out;
    const sl = T.slots(hf.kind, hf.rot | 0);
    for (const q of ridersOf(hf)) {
      if (!q.placed) continue;
      const sp = R.spots(hf.kind, hf.rot | 0, q.kind, q.rot | 0)[q.on.s | 0];
      if (!sp) continue;
      sl.forEach((s, i) => {
        if (i === (q.on.s | 0) || covers(sp, s)) out.push(i);
      });
    }
    return out;
  };
  R.free = function(hp, f) {
    const hf = hp && hp.furn;
    if (!hf || !R.HOSTS[hp.kind] || hp.hidden || hp.ride) return [];
    const sps = R.spots(hp.kind, hp.rot | 0, f.kind, f.rot | 0), sl = T.slots(hp.kind, hp.rot | 0), out = [];
    const items = Array.isArray(hf.top) ? hf.top.map(q => sl[q.s | 0]).filter(Boolean) : [];
    const others = ridersOf(hf).filter(q => q.placed && q !== f && !(q.id === f.id && q.kind === f.kind)).map(q => R.spots(hp.kind, hp.rot | 0, q.kind, q.rot | 0)[q.on.s | 0]).filter(Boolean);
    sps.forEach((sp, s) => {
      if (!sp) return;
      if (items.some(q => covers(sp, q))) return;
      if (others.some(o => Math.abs(o.x - sp.x) < o.hw + sp.hw + 1 && Math.abs(o.y - sp.y) < 10)) return;
      out.push({
        s,
        sp
      });
    });
    return out;
  };
  R.setOn = function(f, ride) {
    if (!f || !R.KINDS[f.kind]) return;
    if (ride && ride.host && ride.host.furn) f.on = {
      id: ride.host.furn.id,
      s: ride.s | 0
    }; else delete f.on;
  };
  R.toLayout = f => R.isOn(f) ? {
    id: f.on.id,
    s: f.on.s | 0
  } : undefined;
  R.fromLayout = function(f, e) {
    if (!f || !R.KINDS[f.kind]) return;
    if (e && e.on && typeof e.on === "object") f.on = {
      id: e.on.id,
      s: e.on.s | 0
    }; else delete f.on;
  };
  R.sync = function(F, home) {
    if (!F || !home || !Array.isArray(home.furn)) return;
    const sel = H.deco && H.deco.sel, isSel = q => !!sel && (q === sel || q.id === sel.id && q.kind === sel.kind), keep = new Set;
    let gone = 0;
    for (const f of home.furn) {
      if (!R.isOn(f) || !f.placed) continue;
      const hf = home.furn.find(q => q && q.id === f.on.id && !R.KINDS[q.kind]);
      if (!hf || !R.HOSTS[hf.kind] || !hf.placed && !isSel(hf)) {
        f.placed = false;
        delete f.on;
        gone++;
        continue;
      }
      if (!hf.placed) continue;
      const hp = F.props.find(q => q.furn && !q.ride && (q.furn === hf || q.furn.id === hf.id) && !R.KINDS[q.furn.kind]);
      if (!hp) continue;
      const sp = R.spots(hp.kind, hp.rot | 0, f.kind, f.rot | 0)[f.on.s | 0], pos = sp && R.posOf(hp, f, sp);
      if (!pos) {
        f.placed = false;
        delete f.on;
        gone++;
        continue;
      }
      f.x = pos.x;
      f.y = pos.y;
      let p = F.props.find(q => q.ride && (q.furn === f || q.furn.id === f.id && q.furn.kind === f.kind));
      if (p && (Math.abs(p.x - f.x) > 1e-9 || Math.abs(p.y - f.y) > 1e-9 || (p.rot | 0) !== (f.rot | 0) || p.furn !== f)) {
        SX.map.removeProp(F, p);
        p = null;
      }
      if (!p) {
        const cat = H.FURN[f.kind];
        p = SX.map.addProp(F, f.kind, f.x, f.y, {
          v: f.v | 0,
          rot: f.rot | 0,
          solid: false,
          tall: false,
          npc: cat && cat.use ? {
            role: cat.use,
            name: cat.name,
            furn: f
          } : null
        });
        if (!p) {
          f.placed = false;
          delete f.on;
          gone++;
          continue;
        }
        p.col = f.col || null;
        p.furn = f;
        p.items = f.items || null;
        p.flat = false;
      }
      p.ride = {
        host: hp,
        s: f.on.s | 0
      };
      keep.add(p);
    }
    for (const p of F.props.slice()) if (p.ride && !keep.has(p)) SX.map.removeProp(F, p);
    for (const p of F.props) if (p.riders) p.riders = null;
    for (const p of keep) {
      const h = p.ride.host;
      (h.riders || (h.riders = [])).push(p);
    }
    F.ver = (F.ver || 0) + 1;
    if (gone && SX.log) SX.log("탁자 위에 올려 둔 정수기는 창고로 옮겼습니다 — 그 자리가 없어졌습니다");
  };
  R.lift = function(F, hp) {
    if (!F || !hp) return;
    if (hp.ride && hp.ride.host && hp.ride.host.riders) {
      const h = hp.ride.host;
      h.riders = h.riders.filter(q => q !== hp);
      if (!h.riders.length) h.riders = null;
    }
    if (!hp.riders) return;
    for (const q of hp.riders) SX.map.removeProp(F, q);
    hp.riders = null;
  };
  R.drop = function(f) {
    if (!f) return 0;
    if (R.KINDS[f.kind]) {
      delete f.on;
      return 0;
    }
    let n = 0;
    for (const q of ridersOf(f)) {
      if (q.placed) n++;
      q.placed = false;
      delete q.on;
    }
    if (n) {
      SX.log("탁자 위에 올려 둔 정수기는 창고로 옮겼습니다");
      const F = curF();
      if (F) R.sync(F, H.save());
    }
    return n;
  };
  R.target = function(F, sel, gx, gy) {
    if (!F || !sel || !R.KINDS[sel.kind]) return null;
    const rs = A.prop(sel.kind, sel.v | 0, sel.col || null, sel.rot | 0);
    if (!rs) return null;
    const b = boxOf(rs), fx = gx * TS + b.ax, fy = gy * TS + rs.oy + b.ay;
    let best = null, bd = .6;
    for (const hp of F.props) {
      if (!hp.furn || hp.ride || !R.HOSTS[hp.kind] || hp.hidden) continue;
      const hs = A.prop(hp.kind, hp.v | 0, hp.col || null, hp.rot | 0);
      if (!hs) continue;
      const hx = (hp.px != null ? hp.px : hp.x) * TS, hy = (hp.py != null ? hp.py : hp.y) * TS + hs.oy;
      for (const e of R.free(hp, sel)) {
        const d = Math.hypot((hx + e.sp.x - fx) / TS, (hy + e.sp.y - fy) / TS * 1.25);
        if (d < bd) {
          bd = d;
          best = {
            hp,
            e
          };
        }
      }
    }
    if (!best) return null;
    const pos = R.posOf(best.hp, sel, best.e.sp);
    if (!pos) return null;
    return {
      host: best.hp,
      s: best.e.s,
      x: pos.x,
      y: pos.y
    };
  };
  R.ghost = null;
  R.listOn = function(hp) {
    const out = [];
    if (hp.riders) for (const q of hp.riders) {
      const f = q.furn;
      if (!f || !f.placed || !R.isOn(f) || !hp.furn || f.on.id !== hp.furn.id) continue;
      const sp = R.spots(hp.kind, hp.rot | 0, f.kind, f.rot | 0)[q.ride.s];
      if (sp) out.push({
        s: sp,
        ride: {
          f,
          p: q
        }
      });
    }
    const g = R.ghost;
    if (g && g.ride && g.ride.host === hp && H.deco && H.deco.sel) {
      const sp = R.spots(hp.kind, hp.rot | 0, g.kind, g.rot | 0)[g.ride.s];
      if (sp) out.push({
        s: sp,
        ride: {
          f: H.deco.sel,
          ghost: true,
          snap: true
        }
      });
    }
    return out;
  };
  R.listGhost = function(ghost) {
    const d = H.deco, hf = d && d.sel, out = [];
    if (!hf || hf.kind !== ghost.kind || !R.HOSTS[hf.kind]) return out;
    for (const q of ridersOf(hf)) {
      if (!q.placed) continue;
      const sp = R.spots(ghost.kind, ghost.rot | 0, q.kind, q.rot | 0)[q.on.s | 0];
      if (sp) out.push({
        s: sp,
        ride: {
          f: q,
          ghost: true
        }
      });
    }
    return out;
  };
  R.drawOne = function(ctx, e, x, y, now) {
    const f = e.ride.f, s = sprOf(f);
    if (!s) return;
    const b = boxOf(A.prop(f.kind, f.v | 0, f.col || null, f.rot | 0)), dx = Math.round(x + e.s.x - b.ax), dy = Math.round(y + e.s.y - b.ay), p = e.ride.p;
    ctx.save();
    if (e.ride.ghost) ctx.globalAlpha = .72;
    ctx.drawImage(s.c, dx, dy);
    if (p && p.hl) {
      ctx.globalAlpha = .22 + Math.sin((now || 0) * 6) * .08;
      ctx.globalCompositeOperation = "lighter";
      ctx.drawImage(s.c, dx, dy);
    }
    ctx.restore();
    if (p && p.furn && SX.homeUse && SX.homeUse.drawOn) SX.homeUse.drawOn(ctx, p, s, dx, dy, now);
    if (e.ride.snap) {
      const c = SX.cbc ? SX.cbc("ok", "#6ef082") : "#6ef082";
      ctx.fillStyle = c;
      ctx.fillRect(dx + b.x0, Math.round(y + e.s.y) + 1, b.w, 1);
    }
  };
  R.selNote = function(f) {
    if (!f) return "";
    if (R.KINDS[f.kind]) return `<p class="small rideNote">탁자 · 책상 · 조리대 · 서랍장 같은 가구 위로 가져가시면 빈 자리에 붙습니다 — 좌클릭으로 올립니다</p>`;
    const n = R.HOSTS[f.kind] ? ridersOf(f).filter(q => q.placed).length : 0;
    return n ? `<p class="small rideNote">위에 올린 정수기도 같이 옮겨집니다 — 창고에 넣거나 팔면 정수기는 창고로 돌아갑니다</p>` : "";
  };
})(window.SX);
