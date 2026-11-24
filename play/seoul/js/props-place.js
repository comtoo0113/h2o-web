"use strict";

(function(SX) {
  const M = SX.map, A = SX.art, PP = SX.propsPlace = {
    on: true
  };
  const T = M.T, AP = () => SX.artPlace;
  const orig = M.buildRaid;
  function hookCourse() {
    const C = SX.course;
    if (!C || C._plc || typeof C.build !== "function") return;
    C._plc = 1;
    const b = C.build;
    C.build = function(lv) {
      const F = lv && lv.floors && lv.floors[0], t0 = F && F.t.slice(), f0 = F && F.fs.slice();
      const r = b.apply(this, arguments);
      if (F && F.mat) {
        let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
        for (let i = 0; i < F.t.length; i++) if (F.t[i] !== t0[i] || F.fs[i] !== f0[i]) {
          const x = i % F.W, y = i / F.W | 0;
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          if (y < y0) y0 = y;
          if (y > y1) y1 = y;
        }
        for (let y = y0 - 1; y <= y1 + 1; y++) for (let x = x0 - 1; x <= x1 + 1; x++) if (F.in(x, y)) {
          const i = F.i(x, y);
          F.mat[i] = 0;
          F.wst[i] = 0;
        }
        if (F.chunks) F.chunks.clear();
      }
      return r;
    };
  }
  M.buildRaid = function(opt) {
    hookCourse();
    const DR = SX.decoRaid, keep = DR ? DR.on : false;
    if (DR) DR.on = false;
    let lv;
    try {
      lv = orig.call(this, opt);
    } finally {
      if (DR) DR.on = keep;
    }
    if (lv && lv.floors) for (const F of lv.floors) F.wallH = 48;
    try {
      if (PP.on) PP.dress(lv, opt);
    } catch (e) {
      console.warn("props-place", e);
    }
    if (SX.texPlace) SX.texPlace.apply(lv, opt);
    if (DR && keep && DR.build) DR.build(lv, opt);
    return lv;
  };
  const REUSE = {
    wardrobe: {
      tall: true,
      cover: .6,
      mat: "wood"
    },
    bunkBed: {
      cover: .4,
      mat: "metal"
    },
    tv: {
      cover: .3,
      mat: "glass"
    },
    waterCooler: {
      cover: .3,
      mat: "plastic"
    },
    radio: {
      cover: .5,
      mat: "metal"
    }
  };
  const infoOf = k => AP() && AP().INFO[k] || REUSE[k] || {};
  const NAMES = {
    medCart: "약품 수레",
    kimchiFridge: "김치냉장고",
    shoeCabinet: "신발장",
    dispRack: "진열대",
    checkout: "계산대 서랍",
    trophyCase: "트로피 장"
  };
  PP.NAMES = NAMES;
  function kit(lv, F, rng, before) {
    const W = F.W, H = F.H, occ = new Uint8Array(W * H), placed = [];
    const mark = (p, v) => {
      for (let y = Math.floor(p.y); y < Math.ceil(p.y + p.h); y++) for (let x = Math.floor(p.x); x < Math.ceil(p.x + p.w); x++) if (F.in(x, y)) occ[F.i(x, y)] = v;
    };
    for (const p of F.props) mark(p, 1);
    const ban = new Uint8Array(W * H);
    const banRect = (x0, y0, x1, y1) => {
      for (let y = Math.max(0, Math.floor(y0)); y <= Math.min(H - 1, Math.floor(y1)); y++) for (let x = Math.max(0, Math.floor(x0)); x <= Math.min(W - 1, Math.floor(x1)); x++) ban[y * W + x] = 1;
    };
    for (const d of F.doors) {
      const pad = d.exit ? 5 : 2;
      banRect(d.x - pad, d.y - pad, d.x + (d.horiz ? d.len : 1) + pad - 1, d.y + (d.horiz ? 1 : d.len) + pad - 1);
    }
    for (const s of F.stairs) banRect(s.x - 2, s.y - 2, s.x + s.w + 1, s.y + s.h + 1);
    for (const z of F.zones) banRect(z.x - 2, z.y - 2, z.x + z.w + 1, z.y + z.h + 1);
    for (const q of lv.spawnPts || []) {
      const x = q.x != null ? q.x : q[0], y = q.y != null ? q.y : q[1];
      banRect(x - 3, y - 3, x + 3, y + 3);
    }
    for (const e of lv.exits || []) if (F.idx === 0 || lv.outdoor) banRect(e.x - 5, e.y - 5, e.x + 5, e.y + 5);
    if (F.vault && F.vault.r) {
      const r = F.vault.r;
      banRect(r.x0 - 1, r.y0 - 1, r.x1 + 1, r.y1 + 1);
    }
    if (F.ctrl && F.ctrl.r) {
      const r = F.ctrl.r;
      banRect(r.x0 - 1, r.y0 - 1, r.x1 + 1, r.y1 + 1);
    }
    if (F.zip) banRect(F.zip.x - 6, F.zip.y - 6, F.zip.x + 6, F.zip.y + 6);
    if (F.escape) banRect(F.escape.x - 3, F.escape.y - 3, F.escape.x + 3, F.escape.y + 3);
    const floorish = (x, y) => {
      if (!F.in(x, y)) return false;
      const t = F.t[F.i(x, y)];
      return t === T.FLOOR || t === T.GROUND;
    };
    const isWall = (x, y) => {
      const t = F.tile(x, y);
      return t === T.WALL || t === T.WINDOW;
    };
    const free = (x, y, w, h, solid) => {
      for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) {
        if (!floorish(xx, yy)) return false;
        const i = F.i(xx, yy);
        if (occ[i] || ban[i]) return false;
        if (solid && F.idx === 0 && !lv.outdoor && F.fs[i] === SX.art.FS.LOBBY) return false;
      }
      return true;
    };
    const put = (kind, x, y, o) => {
      const sz = A.propSize(kind);
      if (!sz) return null;
      const inf = infoOf(kind), solid = inf.solid !== false;
      if (!free(x, y, sz.fw, sz.fh, solid)) return null;
      const p = M.addProp(F, kind, x, y, Object.assign({
        v: rng.i(12),
        solid,
        tall: !!inf.tall,
        cover: inf.cover != null ? inf.cover : .3
      }, o || {}));
      if (!p) return null;
      p.place = 1;
      mark(p, 2);
      if (solid && before && !stillOk(F, lv, before, p)) {
        M.removeProp(F, p);
        mark(p, 0);
        return null;
      }
      placed.push(p);
      return p;
    };
    const spotIn = (r, w, h, wall) => {
      const c = [];
      for (let y = r.y0; y <= r.y1 - h + 1; y++) for (let x = r.x0; x <= r.x1 - w + 1; x++) {
        let top = true;
        for (let xx = x; xx < x + w; xx++) if (!isWall(xx, y - 1)) top = false;
        const side = x === r.x0 && isWall(x - 1, y) || x + w - 1 === r.x1 && isWall(x + w, y) || y + h - 1 === r.y1 && isWall(x, y + h);
        if (wall === "top" && !top) continue;
        if (wall === "any" && !top && !side) continue;
        if (!wall && (x === r.x0 || y === r.y0 || x + w - 1 === r.x1 || y + h - 1 === r.y1)) continue;
        c.push([ x, y ]);
      }
      return rng.shuffle(c);
    };
    const putIn = (r, kind, wall, o) => {
      const sz = A.propSize(kind);
      if (!sz) return null;
      for (const [x, y] of spotIn(r, sz.fw, sz.fh, wall)) {
        const p = put(kind, x, y, o);
        if (p) return p;
      }
      return null;
    };
    const corridorTop = (kind, n, o) => {
      const sz = A.propSize(kind);
      if (!sz) return 0;
      let done = 0;
      for (let t = 0; t < 600 && done < n; t++) {
        const x = 1 + rng.i(W - 2), y = 1 + rng.i(H - 2);
        if (!F.in(x, y) || F.room[F.i(x, y)] !== -1 || F.t[F.i(x, y)] !== T.FLOOR || !F.inside[F.i(x, y)]) continue;
        let top = true;
        for (let xx = x; xx < x + sz.fw; xx++) if (!isWall(xx, y - 1)) top = false;
        if (!top) continue;
        if (!floorish(x, y + sz.fh) || !floorish(x, y + sz.fh + 1) || !floorish(x + sz.fw - 1, y + sz.fh + 1)) continue;
        if (put(kind, x, y, o)) done++;
      }
      return done;
    };
    const scatter = (r, kind, n, o, test) => {
      const sz = A.propSize(kind);
      if (!sz) return 0;
      let done = 0;
      for (let t = 0; t < n * 40 && done < n; t++) {
        const x = r.x0 + rng.i(Math.max(1, r.x1 - r.x0 - sz.fw + 2)), y = r.y0 + rng.i(Math.max(1, r.y1 - r.y0 - sz.fh + 2));
        if (test && !test(x, y)) continue;
        if (put(kind, x, y, o)) done++;
      }
      return done;
    };
    return {
      F,
      occ,
      ban,
      placed,
      put,
      putIn,
      spotIn,
      corridorTop,
      scatter,
      free,
      isWall,
      floorish,
      rng
    };
  }
  function reskin(F, p, kind) {
    const sz = A.propSize(kind), inf = infoOf(kind);
    if (!sz || p.rot) return false;
    const dm = A.propDims(kind, 0);
    if (dm.fw !== p.w || dm.fh !== p.h) return false;
    p.kind = kind;
    p.tall = !!inf.tall;
    if (inf.cover != null) p.cover = inf.cover;
    p.reskin = 1;
    p._vg = null;
    if (p.solid && p.x % 1 === 0 && p.y % 1 === 0 && A.hitTrusted && A.hitTrusted(kind)) {
      const h = A.propHit(kind, 0);
      if (h && h.walk && h.walk.length) {
        p.hit = A.hitAt(h, p.x, p.y);
        p.hit.foot = p.hit.walk;
        if (!h.low) p.hit.walk = M.wallFill(F, p.hit.walk, p.x, p.y, p.w);
        p.auto = true;
        p.fine = true;
        const thin = p.hit.walk.every(q => q.x1 - q.x0 <= .6 && q.y1 - q.y0 <= .6);
        if (thin) {
          if (!F.thin) F.thin = new Uint8Array(F.W * F.H);
          for (let y = p.y; y < p.y + p.h; y++) for (let x = p.x; x < p.x + p.w; x++) F.thin[F.i(x, y)] = 1;
        } else if (F.thin) for (let y = p.y; y < p.y + p.h; y++) for (let x = p.x; x < p.x + p.w; x++) F.thin[F.i(x, y)] = 0;
      }
    }
    if (p.cont && NAMES[kind]) p.cont.name = NAMES[kind];
    return true;
  }
  PP.reskin = reskin;
  const passable = (F, i) => {
    const t = F.t[i];
    if (t !== T.FLOOR && t !== T.GROUND && t !== T.STAIR && t !== T.DOOR) return false;
    return !F.solid[i] || F.thin && F.thin[i];
  };
  function reach(F, lv) {
    const W = F.W, N = W * F.H, seen = new Uint8Array(N), q = new Int32Array(N);
    let h = 0, t = 0;
    const seed = (x, y) => {
      x = Math.floor(x);
      y = Math.floor(y);
      if (!F.in(x, y)) return;
      const i = F.i(x, y);
      if (seen[i] || !passable(F, i)) return;
      seen[i] = 1;
      q[t++] = i;
    };
    for (let i = 0; i < N; i++) if (F.t[i] === T.STAIR) seed(i % W, i / W | 0);
    for (const d of F.doors) if (d.exit) for (const i of d.tiles) seed(i % W, i / W | 0);
    for (const z of F.zones) for (let y = z.y; y < z.y + z.h; y++) for (let x = z.x; x < z.x + z.w; x++) seed(x, y);
    for (const s of lv.spawnPts || []) seed(s.x != null ? s.x : s[0], s.y != null ? s.y : s[1]);
    if (!t) for (let i = 0; i < N && !t; i++) if (passable(F, i) && F.inside[i]) seed(i % W, i / W | 0);
    while (h < t) {
      const i = q[h++], x = i % W, y = i / W | 0;
      for (const [dx, dy] of [ [ 1, 0 ], [ -1, 0 ], [ 0, 1 ], [ 0, -1 ] ]) {
        const xx = x + dx, yy = y + dy;
        if (!F.in(xx, yy)) continue;
        const j = yy * W + xx;
        if (!seen[j] && passable(F, j)) {
          seen[j] = 1;
          q[t++] = j;
        }
      }
    }
    return seen;
  }
  PP.reach = reach;
  function stillOk(F, lv, before, p) {
    const W = F.W, R = 10, x0 = Math.max(0, Math.floor(p.x) - R), x1 = Math.min(W - 1, Math.ceil(p.x + p.w) + R), y0 = Math.max(0, Math.floor(p.y) - R), y1 = Math.min(F.H - 1, Math.ceil(p.y + p.h) + R);
    const need = [], add = (x, y) => {
      if (x < x0 || x > x1 || y < y0 || y > y1) return;
      const i = y * W + x;
      if (before[i] && passable(F, i)) need.push(i);
    };
    const ring = q => {
      for (let y = Math.floor(q.y) - 1; y <= Math.ceil(q.y + q.h); y++) for (let x = Math.floor(q.x) - 1; x <= Math.ceil(q.x + q.w); x++) add(x, y);
    };
    ring(p);
    for (const q of F.props) if ((q.cont || q.npc) && Math.abs(q.x - p.x) < 4 && Math.abs(q.y - p.y) < 4 && contAccess(F, before, q)) {
      const n0 = need.length;
      ring(q);
      if (need.length === n0) return false;
    }
    if (need.length <= 1) return need.length === 1 || !p.solid;
    {
      const seen = new Uint8Array((x1 - x0 + 1) * (y1 - y0 + 1)), ww = x1 - x0 + 1, st = [ need[0] ];
      seen[((need[0] / W | 0) - y0) * ww + (need[0] % W - x0)] = 1;
      while (st.length) {
        const i = st.pop(), x = i % W, y = i / W | 0;
        for (const [dx, dy] of [ [ 1, 0 ], [ -1, 0 ], [ 0, 1 ], [ 0, -1 ] ]) {
          const xx = x + dx, yy = y + dy;
          if (xx < x0 || xx > x1 || yy < y0 || yy > y1) continue;
          const k = (yy - y0) * ww + (xx - x0), j = yy * W + xx;
          if (!seen[k] && passable(F, j)) {
            seen[k] = 1;
            st.push(j);
          }
        }
      }
      if (need.every(i => seen[((i / W | 0) - y0) * ww + (i % W - x0)])) return true;
    }
    const after = reach(F, lv);
    for (let i = 0; i < before.length; i++) if (before[i] && !after[i] && passable(F, i)) return false;
    for (const q of F.props) if ((q.cont || q.npc) && Math.abs(q.x - p.x) < 4 && Math.abs(q.y - p.y) < 4 && contAccess(F, before, q) && !contAccess(F, after, q)) return false;
    return true;
  }
  function contAccess(F, seen, p) {
    for (let y = Math.floor(p.y) - 1; y <= Math.ceil(p.y + p.h); y++) for (let x = Math.floor(p.x) - 1; x <= Math.ceil(p.x + p.w); x++) if (F.in(x, y) && seen[F.i(x, y)]) return true;
    return false;
  }
  function settle(K, lv, before) {
    const F = K.F;
    const ok = () => {
      const after = reach(F, lv);
      for (let i = 0; i < before.length; i++) if (before[i] && !after[i] && passable(F, i)) {
        F.placeWhy = [ "tile", i % F.W, i / F.W | 0 ];
        return false;
      }
      for (const p of F.props) if ((p.cont || p.npc) && contAccess(F, before, p) && !contAccess(F, after, p)) {
        F.placeWhy = [ "cont", p.kind, p.x, p.y ];
        return false;
      }
      return true;
    };
    let n = 0;
    while (K.placed.length && !ok() && n < 400) {
      const p = K.placed.pop();
      M.removeProp(F, p);
      n++;
    }
    return n;
  }
  const roomsOf = (F, theme) => F.rooms.filter(r => r.theme === theme || r.big === theme);
  const DRESS = {
    villa(K) {
      const F = K.F, g = K.rng;
      for (const p of F.props.slice()) {
        const r = roomAt(F, p);
        if (!r) continue;
        if (p.kind === "fridge" && r.theme === "kitchen" && g.chance(.45)) reskin(F, p, "kimchiFridge"); else if (p.kind === "cabinet" && r.theme === "bunk" && g.chance(.4)) reskin(F, p, "shoeCabinet");
      }
      for (const r of roomsOf(F, "bunk")) {
        K.putIn(r, "cushion", false);
        if (g.chance(.6)) K.putIn(r, "cushion", false);
        if (g.chance(.45)) K.putIn(r, "lowTable", false);
        if (g.chance(.35)) K.putIn(r, "dryRack", "any");
        if (g.chance(.3)) K.putIn(r, "tv", "top");
        if (g.chance(.25)) K.putIn(r, "wardrobe", "top");
      }
      for (const r of roomsOf(F, "kitchen")) {
        if (g.chance(.4)) K.putIn(r, "kimchiFridge", "top");
        if (g.chance(.35)) K.putIn(r, "lowTable", false);
        if (g.chance(.3)) K.putIn(r, "cushion", false);
      }
      K.corridorTop("shoeCabinet", 3 + g.i(3));
      K.corridorTop("dryRack", 1 + g.i(2));
    },
    office(K) {
      const F = K.F, g = K.rng;
      for (const p of F.props.slice()) {
        const r = roomAt(F, p);
        if (!r || p.kind !== "desk") continue;
        if (r.big === "cubicles" ? g.chance(.85) : r.theme === "office" && g.chance(.3)) reskin(F, p, "cubeDesk");
      }
      for (const p of F.props.slice()) if (p.kind === "cubeDesk" && g.chance(.7)) K.put("officeChair", p.x + 1 - g.i(2) + g.i(2), p.y + 1);
      for (const r of roomsOf(F, "office")) {
        if (g.chance(.6)) K.putIn(r, "officeChair", false);
        if (g.chance(.35)) K.putIn(r, "waterCooler", "top");
      }
      for (const r of roomsOf(F, "pantry")) if (g.chance(.6)) K.putIn(r, "waterCooler", "top");
      for (const r of roomsOf(F, "store")) if (g.chance(.3)) {
        K.putIn(r, "serverRack", "top");
        K.putIn(r, "serverRack", "top");
      }
      K.corridorTop("waterCooler", 1 + g.i(2));
      K.corridorTop("fireHose", 2);
    },
    mall(K) {
      const F = K.F, g = K.rng;
      for (const p of F.props.slice()) {
        const r = roomAt(F, p);
        if (!r) continue;
        if (p.kind === "shelf" && r.theme === "shop" && g.chance(.6)) reskin(F, p, "dispRack"); else if (p.kind === "counter" && (r.theme === "shop" ? g.chance(.7) : r.big === "atrium" && g.chance(.4))) reskin(F, p, "checkout");
      }
      for (const r of roomsOf(F, "shop")) {
        if (g.chance(.5)) K.putIn(r, "clothesRack", false);
        if (g.chance(.6)) K.putIn(r, "mannequin", "any");
        if (g.chance(.4)) K.putIn(r, "cart", false);
      }
      for (const r of roomsOf(F, "atrium")) {
        for (let k = 0; k < 2; k++) {
          K.putIn(r, "mannequin", false);
          K.putIn(r, "clothesRack", false);
        }
        for (let k = 0; k < 3; k++) K.putIn(r, "cart", false);
      }
      K.corridorTop("cart", 3 + g.i(3));
      K.corridorTop("fireHose", 2);
    },
    hos(K) {
      const F = K.F, g = K.rng;
      for (const p of F.props.slice()) {
        const r = roomAt(F, p);
        if (!r) continue;
        if (p.kind === "cabinet" && p.cont && p.cont.type === "medcab" && (r.theme === "ward" ? g.chance(.5) : g.chance(.3))) reskin(F, p, "medCart");
      }
      for (const r of roomsOf(F, "ward")) {
        if (g.chance(.6)) K.putIn(r, "privCurtain", "top");
        if (g.chance(.4)) K.putIn(r, "wheelchair", false);
        if (g.chance(.5)) K.putIn(r, "medBin", "any");
        for (const b of F.props) if (b.kind === "bed" && b.x >= r.x0 && b.x <= r.x1 && b.y >= r.y0 && b.y <= r.y1 && g.chance(.45)) K.put("vitals", b.x + 1, b.y) || K.put("vitals", b.x - 1, b.y);
      }
      for (const r of roomsOf(F, "surgery")) {
        K.putIn(r, "vitals", "any");
        if (g.chance(.5)) K.putIn(r, "medBin", "any");
        if (g.chance(.4)) K.putIn(r, "gurney", "any");
      }
      for (const r of roomsOf(F, "reception")) {
        for (let k = 0; k < 3; k++) K.putIn(r, "wheelchair", false);
        K.putIn(r, "gurney", false);
        K.putIn(r, "medBin", "any");
      }
      K.corridorTop("gurney", 2 + g.i(2));
      K.corridorTop("wheelchair", 2 + g.i(2));
      K.corridorTop("medBin", 2);
      K.corridorTop("fireHose", 2);
    },
    school(K) {
      const F = K.F, g = K.rng;
      for (const p of F.props.slice()) {
        const r = roomAt(F, p);
        if (!r || r.theme !== "classroom") continue;
        if (p.kind === "desk") reskin(F, p, "schoolDesk"); else if (p.kind === "locker") reskin(F, p, "schoolLocker");
      }
      for (const r of roomsOf(F, "classroom")) {
        const bd = F.props.find(p => p.kind === "board" && p.x >= r.x0 && p.x <= r.x1 && p.y >= r.y0 && p.y <= r.y1);
        if (!(bd && K.put("lectern", bd.x, bd.y + 2))) K.putIn(r, "lectern", false);
        let n = 0;
        for (let y = r.y0 + 3; y <= r.y1 - 1 && n < 6; y += 3) for (let x = r.x0 + 1; x + 1 <= r.x1 - 1 && n < 6; x += 3) if (K.put("schoolDesk", x, y)) n++;
        if (g.chance(.5)) K.putIn(r, "schoolLocker", "top");
      }
      for (const r of roomsOf(F, "library")) if (g.chance(.5)) K.putIn(r, "schoolDesk", false);
      {
        let groups = 0;
        for (let t = 0; t < 30 && groups < 2; t++) {
          const before = K.placed.length;
          if (!K.corridorTop("schoolLocker", 1)) continue;
          const p = K.placed[K.placed.length - 1];
          for (let k = 1; k < 4 + g.i(3); k++) if (!K.put("schoolLocker", p.x + k, p.y)) break;
          if (K.placed.length > before) groups++;
        }
      }
      if (F.idx <= 1) K.corridorTop("trophyCase", 1);
      if (F.idx === 0) K.corridorTop("shoeRack", 2);
      K.corridorTop("fireHose", 2);
    },
    train(K) {
      const F = K.F, g = K.rng;
      for (const r of F.rooms) {
        if (g.chance(.5)) K.putIn(r, "tireStack", false);
        if (g.chance(.4)) K.putIn(r, "schoolDesk", false);
        if (g.chance(.25)) K.putIn(r, "lectern", "top");
        if (g.chance(.3)) K.putIn(r, "cone", false);
      }
      K.corridorTop("schoolLocker", 3);
      K.corridorTop("tireStack", 2);
      K.corridorTop("shoeRack", 1);
    },
    metro(K) {
      const F = K.F, g = K.rng;
      for (const p of F.props.slice()) {
        const r = roomAt(F, p);
        if (p.kind === "bench" && r && (r.theme === "concourse" || r.theme === "platform" || r.big)) reskin(F, p, "termBench");
      }
      for (const r of roomsOf(F, "concourse")) {
        for (let k = 0; k < 3; k++) K.putIn(r, "ticketMachine", "top");
        for (let k = 0; k < 2; k++) K.putIn(r, "luggageCart", false);
        if (r.big) K.putIn(r, "departBoard", false);
        for (let k = 0; k < 4; k++) K.putIn(r, "suitcase", false);
      }
      for (const r of roomsOf(F, "platform")) {
        K.putIn(r, "termBench", false);
        for (let k = 0; k < 3; k++) K.putIn(r, "suitcase", false);
        if (g.chance(.5)) K.putIn(r, "luggageCart", false);
      }
      K.corridorTop("ticketMachine", 1);
      K.corridorTop("fireHose", 2);
      K.corridorTop("suitcase", 3);
    },
    base(K) {
      const F = K.F, g = K.rng;
      for (const p of F.props.slice()) if (p.kind === "crate") reskin(F, p, "milCrate");
      for (const r of roomsOf(F, "barracks")) {
        K.putIn(r, "bunkBed", "any");
        if (g.chance(.5)) K.putIn(r, "bunkBed", "any");
        if (g.chance(.3)) K.putIn(r, "jerrycans", "any");
      }
      for (const r of roomsOf(F, "command")) {
        K.putIn(r, "mapTable", false);
        if (g.chance(.5)) K.putIn(r, "radio", "top");
      }
      for (const r of roomsOf(F, "armory")) for (let k = 0; k < 2; k++) K.putIn(r, "milCrate", "any");
      for (const r of F.rooms.filter(q => q.theme === "motor" || q.big === "motor" || q.big === "yard")) {
        K.putIn(r, "jerrycans", "any");
        K.putIn(r, "jerrycans", false);
        if (r.big === "yard") K.putIn(r, "boomGate", false);
      }
      K.corridorTop("jerrycans", 2);
      K.corridorTop("fireHose", 1);
    },
    heli(K) {
      const F = K.F, g = K.rng;
      for (const p of F.props.slice()) {
        const r = roomAt(F, p);
        if (p.kind === "desk" && r && r.theme === "office" && g.chance(.4)) reskin(F, p, "cubeDesk");
      }
      for (const r of roomsOf(F, "meeting")) {
        K.putIn(r, "camTripod", false);
        K.putIn(r, "camTripod", false);
        K.putIn(r, "studioLight", "any");
        K.putIn(r, "studioLight", "any");
        K.putIn(r, "mixDesk", "top");
      }
      for (const r of roomsOf(F, "office")) if (g.chance(.6)) K.putIn(r, "officeChair", false);
      for (const r of roomsOf(F, "store")) if (g.chance(.3)) K.putIn(r, "serverRack", "top");
      K.corridorTop("waterCooler", 1);
      K.corridorTop("fireHose", 2);
    },
    bridge(K, lv) {
      const F = K.F, X0 = lv.X0, X1 = lv.X1, Y0 = lv.Y0, Y1 = lv.Y1, landN1 = Y0 + 15, landS0 = Y1 - 15, deck = {
        x0: X0 + 2,
        y0: landN1 + 2,
        x1: X1 - 2,
        y1: landS0 - 2
      };
      K.scatter(deck, "cone", 12);
      K.scatter(deck, "motorbike", 3);
      K.scatter(deck, "suitcase", 5);
      K.scatter(deck, "waterBarrier", 4);
      for (let y = landN1 + 10; y < landS0 - 4; y += 26) for (const x of [ X0 + 1, X1 - 1 ]) K.put("roadSign", x, y, {
        v: K.rng.i(2)
      });
      K.scatter({
        x0: 2,
        y0: landS0 + 1,
        x1: F.W - 3,
        y1: Y1 - 6
      }, "cone", 4);
    },
    tunnel(K, lv) {
      const F = K.F, g = K.rng;
      for (const p of F.props.slice()) if (p.kind === "bench") reskin(F, p, "termBench");
      const plat = (x, y) => {
        const m = F.fs[F.i(x, y)];
        return m === SX.art.FS.WALK;
      };
      for (let y = 0; y < F.H; y++) {
        if (!plat(3, y) || !plat(3, y - 1) || !plat(3, y + 1)) continue;
        if (F.fs[F.i(3, y - 2)] !== SX.art.FS.WALK || y % 10 !== 7) continue;
        for (const xs of [ [ 3, 5 ], [ 20, 22 ] ]) for (const x of xs) K.put(x === xs[0] ? "fareGate" : "turnstile", x, y);
      }
      for (let t = 0; t < 8; t++) {
        const x = 3 + g.i(21), y = 2 + g.i(F.H - 4);
        if (plat(x, y) && K.isWall(x, y - 1)) K.put("fireHose", x, y);
      }
      for (let t = 0; t < 60; t++) {
        const x = g.chance(.5) ? 8 : 18, y = 14 + g.i(F.H - 30);
        if (F.fs[F.i(x, y)] === SX.art.FS.CONC) K.put(g.chance(.6) ? "cableDrum" : "suitcase", x, y);
        if (K.placed.length > 12) break;
      }
      for (let t = 0; t < 30; t++) {
        const x = 3 + g.i(21), y = 2 + g.i(F.H - 4);
        if (plat(x, y)) K.put("suitcase", x, y);
      }
    },
    site(K, lv) {
      const F = K.F, g = K.rng, X0 = lv.X0, Y0 = lv.Y0, X1 = lv.X1, Y1 = lv.Y1, yard = {
        x0: X0 + 2,
        y0: Y0 + 4,
        x1: X1 - 2,
        y1: Y1 - 10
      };
      const dirt = (x, y) => F.fs[F.i(x, y)] === SX.art.FS.DIRT;
      for (const r of F.rooms.filter(q => q.theme === "store")) {
        K.putIn(r, "rebar", false);
        if (g.chance(.6)) K.putIn(r, "plyStack", false);
        if (g.chance(.5)) K.putIn(r, "wheelbarrow", false);
        K.putIn(r, "cone", false);
      }
      let sc = 0;
      for (let t = 0; t < 400 && sc < 5; t++) {
        const x = X0 + 2 + g.i(X1 - X0 - 4), y = Y0 + 2 + g.i(Y1 - Y0 - 4);
        if (K.isWall(x, y - 1) && K.isWall(x + 1, y - 1) && dirt(x, y) && dirt(x + 1, y) && !(F.wallColAt && F.wallColAt(x, y - 1))) if (K.put("scaffold", x, y)) sc++;
      }
      K.scatter(yard, "mixer", 2, null, dirt);
      K.scatter(yard, "cone", 12);
      K.scatter(yard, "rebar", 3, null, dirt);
      K.scatter(yard, "plyStack", 2, null, dirt);
      K.scatter(yard, "wheelbarrow", 2, null, dirt);
      K.scatter(yard, "potty", 2, null, (x, y) => dirt(x, y) && K.isWall(x, y - 1));
      K.scatter(yard, "generator", 1, null, dirt);
    }
  };
  function roomAt(F, p) {
    const x = Math.floor(p.x), y = Math.floor(p.y);
    if (!F.in(x, y)) return null;
    const r = F.room[F.i(x, y)];
    return r >= 0 ? F.rooms[r] : null;
  }
  PP.DRESS = DRESS;
  PP.dress = function(lv, opt) {
    if (!lv || !lv.floors || !AP()) return;
    const b = lv.building || {}, id = b.outdoor === "site" ? "site" : b.outdoor === "tunnel" ? "tunnel" : b.outdoor ? "bridge" : b.id, fn = DRESS[id] || DRESS.office;
    for (const F of lv.floors) {
      if (F.kind !== "floor") continue;
      const rng = new SX.Rng(SX.hash("props:" + (lv.seed >>> 0) + ":" + id + ":" + F.idx));
      const before = reach(F, lv), K = kit(lv, F, rng, before);
      fn(K, lv);
      F.placeUndo = settle(K, lv, before);
      F.placeN = K.placed.length;
    }
  };
})(window.SX);
