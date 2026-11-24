"use strict";

(function(SX) {
  const TS = SX.TS, FS = SX.art.FS;
  const M = SX.map = {};
  const T = M.T = {
    VOID: 0,
    FLOOR: 1,
    WALL: 2,
    WINDOW: 3,
    DOOR: 4,
    STAIR: 5,
    GROUND: 6,
    PARAPET: 7
  };
  M.BLOCK = 18;
  M.CORR = 4;
  M.N = 6;
  M.SIZE = M.N * M.BLOCK + (M.N + 1) * M.CORR;
  M.MARGIN = 12;
  M.FH = 4;
  function Floor(W, H, idx, kind) {
    this.W = W;
    this.H = H;
    this.idx = idx;
    this.kind = kind;
    this.t = new Uint8Array(W * H);
    this.fs = new Uint8Array(W * H);
    this.room = new Int16Array(W * H).fill(-1);
    this.inside = new Uint8Array(W * H);
    this.solid = new Uint8Array(W * H);
    this.propAt = new Array(W * H);
    this.win = new Float32Array(W * H);
    this.rooms = [];
    this.doors = [];
    this.doorAt = new Map;
    this.stairs = [];
    this.props = [];
    this.conts = [];
    this.zones = [];
    this.decals = [];
    this.lamps = [];
    this.chunks = new Map;
  }
  Floor.prototype.i = function(x, y) {
    return y * this.W + x;
  };
  Floor.prototype.in = function(x, y) {
    return x >= 0 && y >= 0 && x < this.W && y < this.H;
  };
  Floor.prototype.tile = function(x, y) {
    return this.in(x, y) ? this.t[y * this.W + x] : T.VOID;
  };
  Floor.prototype.set = function(x, y, t, fs) {
    if (!this.in(x, y)) return;
    const i = y * this.W + x;
    this.t[i] = t;
    if (fs != null) this.fs[i] = fs;
  };
  Floor.prototype.blocked = function(x, y, forBullet) {
    x = Math.floor(x);
    y = Math.floor(y);
    if (!this.in(x, y)) return true;
    const t = this.t[y * this.W + x];
    if (t === T.WALL || t === T.WINDOW || t === T.VOID) return true;
    if (t === T.PARAPET) return !forBullet;
    if (t === T.DOOR) {
      const d = this.doorAt.get(y * this.W + x);
      return !d || !d.open;
    }
    if (!forBullet && this.solid[y * this.W + x]) return true;
    return false;
  };
  Floor.prototype.opaque = function(x, y) {
    if (!this.in(x, y)) return true;
    const t = this.t[y * this.W + x];
    if (t === T.WALL || t === T.VOID) return true;
    if (t === T.WINDOW) return this.kind !== "floor";
    if (t === T.DOOR) {
      const d = this.doorAt.get(y * this.W + x);
      return !d || !d.open;
    }
    if (this.noPropOcc) return false;
    const p = this.propAt[y * this.W + x];
    return !!(p && p.tall);
  };
  Floor.prototype.opaqueTile = function(x, y) {
    if (!this.in(x, y)) return true;
    const t = this.t[y * this.W + x];
    if (t === T.WALL || t === T.VOID) return true;
    if (t === T.WINDOW) return this.kind !== "floor";
    if (t === T.DOOR) {
      const d = this.doorAt.get(y * this.W + x);
      return !d || !d.open;
    }
    return false;
  };
  M.Floor = Floor;
  function addDoor(F, x, y, horiz, len, opt) {
    const d = Object.assign({
      x,
      y,
      horiz,
      len,
      open: false,
      locked: false,
      exit: false,
      tiles: []
    }, opt || {});
    for (let k = 0; k < len; k++) {
      const tx = horiz ? x + k : x, ty = horiz ? y : y + k;
      F.set(tx, ty, T.DOOR);
      d.tiles.push(F.i(tx, ty));
      F.doorAt.set(F.i(tx, ty), d);
    }
    d.cx = horiz ? x + len / 2 : x + .5;
    d.cy = horiz ? y + .5 : y + len / 2;
    F.doors.push(d);
    return d;
  }
  M.toggleDoor = function(F, d, open) {
    if (d.locked && open !== false) return false;
    const want = open == null ? !d.open : open;
    if (!want) {
      if (SX.actors && SX.actors.anyOn(F, d)) return false;
    }
    d.open = want;
    if (SX.coop && SX.coop.inCoop && SX.coop.inCoop()) SX.coop.door(F, d);
    return true;
  };
  function hwall(F, x0, x1, y, fs) {
    for (let x = x0; x <= x1; x++) {
      const t = F.tile(x, y);
      if (t !== T.DOOR && t !== T.STAIR) F.set(x, y, T.WALL, fs);
    }
  }
  function vwall(F, x, y0, y1, fs) {
    for (let y = y0; y <= y1; y++) {
      const t = F.tile(x, y);
      if (t !== T.DOOR && t !== T.STAIR) F.set(x, y, T.WALL, fs);
    }
  }
  function fillRect(F, x0, y0, x1, y1, t, fs, room) {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (!F.in(x, y)) continue;
      const i = F.i(x, y);
      F.t[i] = t;
      F.fs[i] = fs;
      if (room != null) F.room[i] = room;
    }
  }
  function doorOnSeg(F, horiz, fixed, a0, a1, opt) {
    const len = a1 - a0 + 1;
    if (len < 4) return null;
    const c = a0 + Math.floor((len - 2) / 2);
    return horiz ? addDoor(F, c, fixed, true, 2, opt) : addDoor(F, fixed, c, false, 2, opt);
  }
  M.buildBridge = function(opt) {
    const b = opt.building, rng = new SX.Rng(opt.seed);
    const DECK = 18, LANDH = 16, LEN = 168, MGX = 9, MGY = 3;
    const W = DECK + MGX * 2, H = LEN + LANDH * 2 + MGY * 2;
    const X0 = MGX, X1 = MGX + DECK - 1, Y0 = MGY, Y1 = MGY + LANDH * 2 + LEN - 1;
    const landN1 = Y0 + LANDH - 1, landS0 = Y1 - LANDH + 1, cx = X0 + DECK / 2;
    const F = new Floor(W, H, 0, "floor");
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) F.set(x, y, T.VOID, FS.WATER);
    for (const [ya, yb] of [ [ Y0, landN1 ], [ landS0, Y1 ] ]) for (let y = ya; y <= yb; y++) for (let x = 1; x < W - 1; x++) F.set(x, y, T.GROUND, x >= X0 + 2 && x <= X1 - 2 ? FS.ASPH : FS.WALK);
    for (let y = landN1 + 1; y < landS0; y++) {
      F.set(X0, y, T.PARAPET, FS.CONC);
      F.set(X1, y, T.PARAPET, FS.CONC);
      F.set(X0 + 1, y, T.GROUND, FS.WALK);
      F.set(X1 - 1, y, T.GROUND, FS.WALK);
      for (let x = X0 + 2; x <= X1 - 2; x++) F.set(x, y, T.GROUND, FS.ASPH);
    }
    let rid = 0;
    const addRoom = (x0, y0, x1, y1) => {
      const r = {
        id: rid++,
        x0,
        y0,
        x1,
        y1,
        floor: 0,
        theme: "street"
      };
      F.rooms.push(r);
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) F.room[F.i(x, y)] = r.id;
      return r;
    };
    for (let y = landN1 + 1; y < landS0; y += 6) {
      const y1 = Math.min(y + 5, landS0 - 1);
      addRoom(X0 + 1, y, X0 + 8, y1);
      addRoom(X0 + 9, y, X1 - 1, y1);
    }
    for (let y = Y0 + 5; y <= landN1; y += 6) addRoom(X0 + 1, y, X1 - 1, Math.min(y + 5, landN1));
    const ctx = {
      building: b,
      floor: 0,
      intel: opt.intel
    };
    const putC = (kind, x, y, contType, o) => {
      const sz = SX.art.propSize(kind);
      if (!sz || !freeRect(F, x, y, sz.fw, sz.fh, 0)) return null;
      return addProp(F, kind, x, y, Object.assign({
        v: rng.i(12)
      }, o || {}, contType ? {
        cont: mkCont(contType, SX.items.rollContainer(rng, contType, ctx), rng)
      } : {}));
    };
    const cps = [ landN1 + Math.round(LEN / 3), landN1 + Math.round(LEN * 2 / 3) ];
    for (let y = landN1 + 4; y < landS0 - 6; y += 3 + rng.i(4)) {
      if (cps.some(c => Math.abs(y - c) < 5)) continue;
      const bus = rng.chance(.15), kind = bus ? "bus" : "car", w = bus ? 5 : 3;
      const x = X0 + 2 + rng.i(DECK - 4 - w + 1);
      if (putC(kind, x, y, null, {
        solid: true,
        cover: .9
      }) && rng.chance(.35)) putC("trash", rng.chance(.5) ? x - 1 : x + w, y + rng.i(2), "trash", {
        solid: false
      });
      if (rng.chance(.25)) putC("bag", X0 + 1 + (rng.chance(.5) ? 0 : DECK - 3), y + rng.i(2), "bag", {
        solid: false
      });
    }
    for (const cy of cps) {
      const gap = X0 + 3 + rng.i(DECK - 8);
      for (let x = X0 + 2; x <= X1 - 3; x += 2) {
        if (x >= gap - 1 && x <= gap + 1) continue;
        putC("barrier", x, cy, null, {
          solid: true,
          cover: .7
        });
      }
      putC("drum", gap + 3 < X1 - 2 ? gap + 3 : gap - 3, cy - 2, null, {
        solid: true,
        cover: .7
      });
      putC("crate", X0 + 2 + rng.i(DECK - 6), cy - 4, "crate");
      F.lamps.push({
        x: gap + .5,
        y: cy + .5,
        r: 8,
        c: [ 255, 210, 150 ],
        a: .7,
        flicker: true
      });
    }
    for (let x = X0 + 2; x <= X1 - 3; x += 2) if (Math.abs(x - cx) > 2) putC("barrier", x, landN1 + 1, null, {
      solid: true,
      cover: .7
    });
    for (let k = 0; k < 2; k++) putC("crate", X0 + 3 + rng.i(DECK - 8), Y0 + 7 + k * 3, "crate");
    for (let k = 0; k < 3; k++) putC("bag", X0 + 2 + rng.i(DECK - 5), landS0 + 2 + rng.i(6), "bag", {
      solid: false
    });
    for (const y of [ landS0 + 3, Y0 + 3 ]) for (const x of [ 2, X1 + 4 ]) putC("bigBoard", x, y, null, {
      solid: false
    });
    for (let y = landN1 + 6; y < landS0; y += 12) for (const x of [ X0, X1 ]) {
      addProp(F, "lamp", x, y, {
        v: rng.i(9)
      });
      F.lamps.push({
        x: x + .5,
        y: y + .5,
        r: 6,
        c: [ 255, 230, 170 ],
        a: .5,
        flicker: rng.chance(.3)
      });
    }
    for (const [ya, yb] of [ [ Y0 + 1, landN1 - 1 ], [ landS0 + 1, Y1 - 1 ] ]) for (let k = 0; k < 6; k++) {
      const x = rng.chance(.5) ? 2 + rng.i(X0 - 3) : X1 + 2 + rng.i(W - X1 - 4), y = ya + rng.i(yb - ya);
      putC(rng.chance(.6) ? "tree" : "drum", x, y, null, {
        solid: true
      });
    }
    F.zones.push({
      kind: "bridge",
      x: X0 + 2,
      y: Y0 + 1,
      w: DECK - 4,
      h: 3,
      label: "북단 검문소"
    });
    F.zones.push({
      kind: "door",
      x: X0 + 2,
      y: Y1 - 1,
      w: DECK - 4,
      h: 2,
      label: "돌아가기"
    });
    F.zip = {
      x: cx + .5,
      y: Y0 + 8.5
    };
    F.hut = {
      x: -99,
      y: -99
    };
    const spawnPts = [];
    for (let k = 0; k < 12; k++) spawnPts.push([ X0 + 3 + k % 6 * Math.floor((DECK - 6) / 5) + .5, Y1 - 4.5 - Math.floor(k / 6) * 2 ]);
    {
      const dep = new Uint8Array(W * H);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const i = F.i(x, y);
        if (F.t[i] !== T.VOID || F.fs[i] !== FS.WATER) continue;
        let sh = false, nb = false;
        for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
          const u = x + dx, v = y + dy;
          if (u < 0 || v < 0 || u >= W || v >= H) continue;
          const t = F.t[F.i(u, v)];
          if (t === T.GROUND && (v <= landN1 || v >= landS0)) nb = true;
          if (t === T.PARAPET && dy === 0 && (dx === 1 || dx === -1)) sh = true;
        }
        dep[i] = sh ? 2 : nb ? 1 : 0;
      }
      F.tintAt = (tx, ty, fs) => {
        if (fs !== FS.WATER || tx < 0 || ty < 0 || tx >= W || ty >= H) return null;
        const d = dep[F.i(tx, ty)];
        return d === 1 ? "#22303d" : d === 2 ? "#172029" : null;
      };
    }
    computeWindowLight(F);
    return {
      building: b,
      seed: opt.seed,
      W,
      H,
      floors: [ F ],
      X0,
      Y0,
      X1,
      Y1,
      stairBlocks: [],
      exits: [ {
        x: cx,
        y: Y1,
        side: "s"
      } ],
      roofIdx: 0,
      escape: null,
      zip: F.zip,
      outdoor: true,
      spawnPts
    };
  };
  M.buildTunnel = function(opt) {
    const b = opt.building, rng = new SX.Rng(opt.seed);
    const W = 27, NEND = 12, TUN = 50, MID = 20, SST = 22, MGY = 2;
    const H = MGY * 2 + NEND + TUN * 2 + MID + SST;
    const X0 = 3, X1 = 23, Y0 = MGY, Y1 = H - MGY - 1;
    const yN1 = Y0 + NEND - 1, yT1a = yN1 + 1, yT1b = yN1 + TUN, yM0 = yT1b + 1, yM1 = yM0 + MID - 1, yT2a = yM1 + 1, yT2b = yM1 + TUN, yS0 = yT2b + 1;
    const F = new Floor(W, H, 0, "floor");
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) F.set(x, y, T.VOID, FS.VOID);
    const carve = (x0, y0, x1, y1, fsOf) => {
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        if (!F.in(x, y)) continue;
        const i = F.i(x, y);
        F.t[i] = T.FLOOR;
        F.fs[i] = typeof fsOf === "function" ? fsOf(x, y) : fsOf;
        F.inside[i] = 1;
      }
    };
    const trackFs = x => x >= 9 && x <= 11 || x >= 15 && x <= 17 ? FS.RAIL : FS.CONC;
    for (const [ya, yb] of [ [ yT1a, yT1b ], [ yT2a, yT2b ] ]) {
      carve(8, ya, 12, yb, trackFs);
      carve(14, ya, 18, yb, trackFs);
    }
    const platFs = x => x <= 7 || x >= 19 || x === 13 ? FS.WALK : trackFs(x);
    carve(X0, yM0, X1, yM1, platFs);
    carve(X0, yS0, X1, Y1, platFs);
    carve(X0, Y0, X1, yN1, x => trackFs(x) === FS.RAIL ? FS.RAIL : FS.CONC);
    for (const [ya, yb] of [ [ yM0, yM1 ], [ yS0, Y1 ] ]) for (let y = ya + 3; y <= yb - 3; y += 5) for (const x of [ 5, 13, 21 ]) F.set(x, y, T.WALL, FS.CONC);
    const cross = [];
    for (const [ya, yb] of [ [ yT1a, yT1b ], [ yT2a, yT2b ] ]) for (let y = ya + 5 + rng.i(4); y < yb - 4; y += 10 + rng.i(5)) {
      carve(13, y, 13, y + 1, FS.CONC);
      cross.push(y);
      if (rng.chance(.5)) addDoor(F, 13, y, false, 2, {
        locked: rng.chance(.15)
      });
    }
    const carX = rng.chance(.5) ? 8 : 14, car0 = yT1a + 10 + rng.i(TUN - 36), cars = [];
    for (let k = 0; k < 2; k++) {
      const ya = car0 + k * 12, yb = ya + 11;
      for (const y of [ ya, yb ]) for (let x = carX; x <= carX + 4; x++) F.set(x, y, T.WALL, FS.CONC);
      for (let y = ya + 1; y < yb; y++) for (let x = carX; x <= carX + 4; x++) {
        const i = F.i(x, y);
        F.t[i] = T.FLOOR;
        F.fs[i] = FS.LINO;
      }
      for (const y of [ ya, yb ]) addDoor(F, carX + 1, y, true, 2, {
        locked: k === 1 && y === yb && rng.chance(.3)
      });
      cars.push({
        x0: carX,
        y0: ya + 1,
        x1: carX + 4,
        y1: yb - 1
      });
    }
    const huts = [];
    for (const [ya, yb] of [ [ yT1a, yT1b ], [ yT2a, yT2b ] ]) for (let y = ya + 3 + rng.i(6); y < yb - 7; y += 11 + rng.i(8)) {
      const left = rng.chance(.5), hx0 = left ? 3 : 20;
      if (cars.some(c => (left ? carX === 8 : carX === 14) && y + 5 >= c.y0 - 1 && y <= c.y1 + 1)) continue;
      carve(hx0, y, hx0 + 3, y + 4, FS.LINO);
      addDoor(F, left ? 7 : 19, y + 1, false, 2, {
        locked: rng.chance(.2)
      });
      huts.push({
        x0: hx0,
        y0: y,
        x1: hx0 + 3,
        y1: y + 4
      });
    }
    const walk = (x, y) => {
      const t = F.tile(x, y);
      return t === T.FLOOR || t === T.DOOR;
    };
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (F.tile(x, y) !== T.VOID) continue;
      let near = false;
      for (let dy = -1; dy <= 1 && !near; dy++) for (let dx = -1; dx <= 1 && !near; dx++) if (walk(x + dx, y + dy)) near = true;
      if (near) F.set(x, y, T.WALL, FS.CONC);
    }
    let rid = 0;
    const addRoom = (x0, y0, x1, y1, theme) => {
      const r = {
        id: rid++,
        x0,
        y0,
        x1,
        y1,
        floor: 0,
        theme: theme || "street"
      };
      F.rooms.push(r);
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (F.tile(x, y) === T.FLOOR && F.room[F.i(x, y)] < 0) F.room[F.i(x, y)] = r.id;
      return r;
    };
    for (const c of cars) addRoom(c.x0, c.y0, c.x1, c.y1, "storage");
    for (const h of huts) addRoom(h.x0, h.y0, h.x1, h.y1, "storage");
    for (const [ya, yb] of [ [ yT1a, yT1b ], [ yT2a, yT2b ] ]) for (let y = ya; y <= yb; y += 6) {
      const y1 = Math.min(y + 5, yb);
      addRoom(8, y, 12, y1);
      addRoom(14, y, 18, y1);
    }
    for (const [ya, yb] of [ [ yM0, yM1 ], [ yS0, Y1 ] ]) for (let y = ya; y <= yb; y += 5) {
      const y1 = Math.min(y + 4, yb);
      addRoom(X0, y, 12, y1, "lobby");
      addRoom(13, y, X1, y1, "lobby");
    }
    addRoom(X0, Y0 + 5, X1, yN1);
    const ctx = {
      building: b,
      floor: 0,
      intel: opt.intel
    };
    const putC = (kind, x, y, contType, o) => {
      const sz = SX.art.propSize(kind);
      if (!sz || !freeRect(F, x, y, sz.fw, sz.fh, 0)) return null;
      return addProp(F, kind, x, y, Object.assign({
        v: rng.i(12)
      }, o || {}, contType ? {
        cont: mkCont(contType, SX.items.rollContainer(rng, contType, ctx), rng)
      } : {}));
    };
    const lamp = (x, y, r, c, a, fl) => F.lamps.push({
      x: x + .5,
      y: y + .5,
      r,
      c,
      a,
      flicker: fl
    });
    for (const [ya, yb] of [ [ yT1a, yT1b ], [ yT2a, yT2b ] ]) {
      for (let y = ya + 4; y <= yb; y += 10) for (const x of [ 8, 18 ]) lamp(x, y, 5, [ 255, 80, 60 ], .45, rng.chance(.4));
      for (let k = 0; k < 7; k++) {
        const x = rng.chance(.5) ? 8 + rng.i(5) : 14 + rng.i(5), y = ya + 2 + rng.i(TUN - 4), r = rng.f();
        if (r < .35) putC("bag", x, y, "bag", {
          solid: false
        }); else if (r < .55) putC("bag", x, y, "bag", {
          solid: false
        }); else if (r < .75) putC("trash", x, y, "trash", {
          solid: false
        }); else putC("drum", x, y, null, {
          solid: true,
          cover: .7
        });
      }
    }
    for (const c of cars) {
      for (let y = c.y0 + 1; y <= c.y1 - 2; y += 3) putC("bench", rng.chance(.5) ? c.x0 : c.x1 - 1, y, null, {
        solid: true,
        cover: .4
      });
      for (let k = 0; k < 2; k++) putC((rng.chance(.6), "bag"), c.x0 + 2, c.y0 + 2 + rng.i(c.y1 - c.y0 - 3), (rng.chance(.6), 
      "bag"), {
        solid: false
      });
      lamp(c.x0 + 2, c.y0 + c.y1 >> 1, 4, [ 220, 230, 255 ], .35, true);
    }
    for (const h of huts) {
      putC("locker", h.x0 + (h.x0 === 3 ? 0 : 3), h.y0, "locker");
      putC("shelf", h.x0 + 1, h.y0 + 4, "shelf");
      if (rng.chance(.6)) putC("crate", h.x0 + (h.x0 === 3 ? 0 : 3), h.y0 + 3, "crate");
      if (rng.chance(.4)) putC("cabinet", h.x0 + (h.x0 === 3 ? 3 : 0), h.y0, "cabinet");
      lamp(h.x0 + 1, h.y0 + 2, 4, [ 255, 220, 160 ], .4, rng.chance(.5));
    }
    for (const [ya, yb] of [ [ yM0, yM1 ], [ yS0, Y1 - 3 ] ]) {
      for (let y = ya + 1; y <= yb - 1; y += 4) {
        putC("bench", 3, y, null, {
          solid: true,
          cover: .4
        });
        putC("bench", 22, y, null, {
          solid: true,
          cover: .4
        });
      }
      putC("vending", 4, ya, null, {
        solid: true
      });
      putC("vending", 22, ya, null, {
        solid: true
      });
      putC("atm", 20, ya, null, {
        solid: true
      });
      putC("bigBoard", 8, ya, null, {
        solid: false
      });
      putC("bigBoard", 14, ya, null, {
        solid: false
      });
      for (let k = 0; k < 4; k++) putC(rng.chance(.5) ? "trash" : "bag", rng.chance(.5) ? 3 + rng.i(5) : 19 + rng.i(5), ya + 1 + rng.i(yb - ya - 1), rng.chance(.5) ? "trash" : "bag", {
        solid: false
      });
      for (let y = ya + 2; y <= yb; y += 6) for (const x of [ 6, 13, 20 ]) if (rng.chance(.6)) lamp(x, y, 7, [ 235, 240, 255 ], .55, rng.chance(.35));
    }
    for (const by of [ yM0 + 2, yM1 - 2 ]) {
      const gaps = [ 8 + rng.i(3), 14 + rng.i(3) ];
      for (let x = 8; x <= 17; x += 2) {
        if (gaps.some(g => x >= g - 1 && x <= g + 1)) continue;
        putC("barrier", x, by, null, {
          solid: true,
          cover: .7
        });
      }
    }
    {
      const my = yM0 + yM1 >> 1;
      putC("fire", 13, my - 2, null, {
        solid: true
      });
      lamp(13, my - 2, 9, [ 255, 170, 90 ], .8, true);
      for (let k = 0; k < 3; k++) putC("cot", 3 + k % 2 * 17, my - 3 + k * 3, null, {
        solid: false
      });
      for (let k = 0; k < 3; k++) putC("crate", 6 + rng.i(14), yM0 + 4 + rng.i(MID - 8), "crate");
      putC("radio", 14, my + 1, null, {
        solid: true
      });
      putC("stash", 9, my + 2, "crate");
    }
    for (let x = X0 + 1; x <= X1 - 2; x += 2) if (Math.abs(x - 13) > 2) putC("barrier", x, yN1, null, {
      solid: true,
      cover: .7
    });
    for (let k = 0; k < 2; k++) putC("crate", X0 + 2 + rng.i(X1 - X0 - 6), Y0 + 4 + k * 3, "crate");
    putC("drum", X0, Y0 + 3, null, {
      solid: true
    });
    putC("drum", X1, Y0 + 5, null, {
      solid: true
    });
    putC("workbench", X1 - 3, Y0 + 8, null, {
      solid: true
    });
    lamp(13, Y0 + 1, 6, [ 255, 210, 140 ], .6, true);
    lamp(6, Y0 + 7, 5, [ 255, 80, 60 ], .45, true);
    lamp(20, Y0 + 7, 5, [ 255, 80, 60 ], .45, true);
    F.zones.push({
      kind: "tunnel",
      x: 10,
      y: Y0,
      w: 7,
      h: 2,
      label: "비상 사다리"
    });
    F.zones.push({
      kind: "door",
      x: X0 + 2,
      y: Y1 - 1,
      w: X1 - X0 - 3,
      h: 2,
      label: "돌아가기"
    });
    F.zip = {
      x: 13.5,
      y: Y0 + 6.5
    };
    F.bossFloor = true;
    F.hut = {
      x: -99,
      y: -99
    };
    const spawnPts = [];
    for (let k = 0; k < 12; k++) spawnPts.push([ X0 + 2 + k % 6 * 3 + .5, Y1 - 4.5 - Math.floor(k / 6) * 2 ]);
    computeWindowLight(F);
    return {
      building: b,
      seed: opt.seed,
      W,
      H,
      floors: [ F ],
      X0,
      Y0,
      X1,
      Y1,
      stairBlocks: [],
      exits: [ {
        x: 13,
        y: Y1,
        side: "s"
      } ],
      roofIdx: 0,
      escape: null,
      zip: F.zip,
      outdoor: "tunnel",
      spawnPts
    };
  };
  M.buildSite = function(opt) {
    const b = opt.building, rng = new SX.Rng(opt.seed);
    const W = 72, H = 66, MG = 2, X0 = MG, Y0 = MG, X1 = W - MG - 1, Y1 = H - MG - 1, cx = Math.floor(W / 2);
    const F = new Floor(W, H, 0, "floor");
    const cols = new Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) F.set(x, y, T.VOID, FS.DIRT);
    for (let y = Y0 + 1; y < Y1; y++) for (let x = X0 + 1; x < X1; x++) F.set(x, y, T.GROUND, FS.DIRT);
    const fence = "#6e6f68";
    for (let x = X0; x <= X1; x++) for (const y of [ Y0, Y1 ]) {
      const gate = y === Y1 ? Math.abs(x - cx) <= 4 : Math.abs(x - cx) <= 2;
      if (gate) {
        F.set(x, y, T.GROUND, FS.ASPH);
        continue;
      }
      F.set(x, y, T.WALL, FS.CONC);
      cols[F.i(x, y)] = fence;
    }
    for (let y = Y0; y <= Y1; y++) for (const x of [ X0, X1 ]) {
      F.set(x, y, T.WALL, FS.CONC);
      cols[F.i(x, y)] = fence;
    }
    for (let y = Y0; y <= Y1; y++) for (let x = cx - 3; x <= cx + 3; x++) if (F.tile(x, y) === T.GROUND) F.set(x, y, T.GROUND, FS.ASPH);
    const solidBox = (x0, y0, x1, y1) => {
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (F.tile(x, y) !== T.GROUND) return false;
      return true;
    };
    const frames = [];
    const frameAt = [ [ X0 + 4, Y0 + 5 ], [ cx + 7, Y0 + 5 ], [ X0 + 4, Y0 + 32 ] ];
    for (const [fx, fy] of frameAt) {
      const w = 18 + rng.i(5), h = 12 + rng.i(4), x1 = Math.min(fx + w, cx - 5 + (fx > cx ? 40 : 0)), y1 = fy + h;
      const xa = fx, xb = Math.min(x1, X1 - 3), ya = fy, yb = y1;
      for (let y = ya; y <= yb; y++) for (let x = xa; x <= xb; x++) F.set(x, y, T.FLOOR, FS.CONC);
      for (let x = xa; x <= xb; x++) for (const y of [ ya, yb ]) if ((x - xa) % 5 !== 2 && (x - xa) % 5 !== 3) F.set(x, y, T.WALL, FS.CONC);
      for (let y = ya; y <= yb; y++) for (const x of [ xa, xb ]) if ((y - ya) % 4 !== 2) F.set(x, y, T.WALL, FS.CONC);
      for (let y = ya + 3; y < yb - 1; y += 4) for (let x = xa + 4; x < xb - 1; x += 5) F.set(x, y, T.WALL, FS.CONC);
      frames.push({
        x0: xa + 1,
        y0: ya + 1,
        x1: xb - 1,
        y1: yb - 1
      });
    }
    const CC = [ "#3a5a8a", "#8a3e2c", "#3f6a3a", "#8a7a36", "#5a5a62" ];
    const cy0 = Y0 + 34, cx0 = cx + 6;
    for (let row = 0; row < 3; row++) for (let k = 0; k < 6; k++) {
      if (rng.chance(.18)) continue;
      const x = cx0 + k * 4, y = cy0 + row * 8, col = CC[rng.i(CC.length)];
      if (x + 1 >= X1 - 1 || y + 4 >= Y1 - 6) continue;
      for (let yy = y; yy <= y + 4; yy++) for (let xx = x; xx <= x + 1; xx++) {
        F.set(xx, yy, T.WALL, FS.CONC);
        cols[F.i(xx, yy)] = col;
      }
    }
    const ox0 = cx - 18, oy0 = Y0 + 21, ox1 = ox0 + 11, oy1 = oy0 + 7;
    for (let y = oy0; y <= oy1; y++) for (let x = ox0; x <= ox1; x++) {
      const edge = x === ox0 || x === ox1 || y === oy0 || y === oy1;
      F.set(x, y, edge ? T.WALL : T.FLOOR, edge ? FS.CONC : FS.LINO);
      if (!edge) F.inside[F.i(x, y)] = 1;
    }
    for (const x of [ ox0 + 3, ox0 + 8 ]) F.set(x, oy0, T.WINDOW, FS.CONC);
    addDoor(F, ox0 + 5, oy1, true, 2, {});
    F.wallColAt = (x, y) => F.in(x, y) && cols[F.i(x, y)] || null;
    let rid = 0;
    const addRoom = (x0, y0, x1, y1, theme) => {
      const r = {
        id: rid++,
        x0,
        y0,
        x1,
        y1,
        floor: 0,
        theme: theme || "street"
      };
      F.rooms.push(r);
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const t = F.tile(x, y);
        if ((t === T.FLOOR || t === T.GROUND) && F.room[F.i(x, y)] < 0) F.room[F.i(x, y)] = r.id;
      }
      return r;
    };
    addRoom(ox0 + 1, oy0 + 1, ox1 - 1, oy1 - 1, "office");
    for (const fr of frames) addRoom(fr.x0, fr.y0, fr.x1, fr.y1, "store");
    for (let y = Y0 + 1; y < Y1; y += 8) for (let x = X0 + 1; x < X1; x += 8) addRoom(x, y, Math.min(x + 7, X1 - 1), Math.min(y + 7, Y1 - 1));
    const ctx = {
      building: b,
      floor: 0,
      intel: opt.intel
    };
    const putC = (kind, x, y, contType, o) => {
      const sz = SX.art.propSize(kind);
      if (!sz || !freeRect(F, x, y, sz.fw, sz.fh, 0)) return null;
      if (y + sz.fh > Y1 - 9 && x + sz.fw > cx - 8 && x < cx + 8) return null;
      return addProp(F, kind, x, y, Object.assign({
        v: rng.i(12)
      }, o || {}, contType ? {
        cont: mkCont(contType, SX.items.rollContainer(rng, contType, ctx), rng)
      } : {}));
    };
    const lamp = (x, y, r, c, a, fl) => F.lamps.push({
      x: x + .5,
      y: y + .5,
      r,
      c,
      a,
      flicker: fl
    });
    for (const x of [ X0 + 4, cx + 8, X1 - 8 ]) putC("bigBoard", x, Y0 + 1, null, {
      solid: false
    });
    for (const x of [ X0 + 4, X1 - 8 ]) putC("bigBoard", x, Y1 - 1, null, {
      solid: false
    });
    putC("desk", ox0 + 1, oy0 + 1, "desk");
    putC("desk", ox0 + 4, oy0 + 1, "desk");
    putC("board", ox0 + 7, oy0 + 1, null, {
      solid: true
    });
    putC("cabinet", ox1 - 1, oy0 + 1, "cabinet");
    putC("locker", ox1 - 1, oy0 + 3, "locker");
    putC("chair", ox0 + 2, oy0 + 3, null, {
      solid: false
    });
    putC("shelf", ox0 + 1, oy1 - 2, "shelf");
    lamp(ox0 + 5, oy0 + 3, 6, [ 255, 230, 170 ], .6, false);
    for (const fr of frames) {
      for (let k = 0; k < 7; k++) {
        const x = fr.x0 + rng.i(Math.max(1, fr.x1 - fr.x0 - 1)), y = fr.y0 + rng.i(Math.max(1, fr.y1 - fr.y0 - 1)), r = rng.f();
        if (r < .3) putC("crate", x, y, "crate"); else if (r < .55) putC("boxes", x, y, null, {
          solid: true,
          cover: .6
        }); else if (r < .7) putC("drum", x, y, null, {
          solid: true,
          cover: .7
        }); else putC("bag", x, y, "bag", {
          solid: false
        });
      }
    }
    for (let k = 0; k < 4; k++) putC(rng.chance(.4) ? "bus" : "car", X0 + 3 + rng.i(X1 - X0 - 10), Y0 + 20 + rng.i(30), null, {
      solid: true,
      cover: .9
    });
    for (let k = 0; k < 18; k++) {
      const x = X0 + 2 + rng.i(X1 - X0 - 4), y = Y0 + 2 + rng.i(Y1 - Y0 - 4), r = rng.f();
      if (r < .2) putC("crate", x, y, "crate"); else if (r < .4) putC("drum", x, y, null, {
        solid: true,
        cover: .7
      }); else if (r < .55) putC("barrier", x, y, null, {
        solid: true,
        cover: .7
      }); else if (r < .7) putC("boxes", x, y, null, {
        solid: true,
        cover: .6
      }); else if (r < .85) putC("trash", x, y, "trash", {
        solid: false
      }); else putC("bag", x, y, "bag", {
        solid: false
      });
    }
    {
      const sx = cx + 6, sy = Y0 + 24;
      putC("fire", sx + 2, sy + 1, null, {
        solid: true
      });
      lamp(sx + 2, sy + 1, 8, [ 255, 170, 90 ], .8, true);
      for (let k = 0; k < 3; k++) putC("cot", sx + k % 2 * 4, sy + 3 + Math.floor(k / 2) * 2, null, {
        solid: false
      });
      putC("radio", sx + 5, sy, null, {
        solid: true
      });
      putC("workbench", sx, sy - 2, null, {
        solid: true
      });
      putC("stash", sx + 6, sy + 3, "crate");
    }
    for (const [x, y] of [ [ X0 + 2, Y0 + 2 ], [ X1 - 2, Y0 + 2 ], [ X0 + 2, Y1 - 2 ], [ X1 - 2, Y1 - 2 ], [ cx - 4, Y0 + 30 ], [ cx + 4, Y0 + 12 ] ]) {
      addProp(F, "lamp", x, y, {
        v: rng.i(9)
      });
      lamp(x, y, 9, [ 255, 240, 200 ], .55, rng.chance(.3));
    }
    F.zones.push({
      kind: "site",
      x: cx - 2,
      y: Y0,
      w: 5,
      h: 2,
      label: "공사장 뒷문"
    });
    F.zones.push({
      kind: "door",
      x: cx - 4,
      y: Y1 - 1,
      w: 9,
      h: 2,
      label: "돌아가기"
    });
    for (let y = Y0 + 1; y <= Y0 + 3; y++) for (let x = cx - 6; x <= cx + 6; x++) if (Math.abs(x - cx) > 2 && rng.chance(.7)) putC("barrier", x, y, null, {
      solid: true,
      cover: .7
    });
    F.zip = {
      x: cx + .5,
      y: Y0 + 8.5
    };
    F.hut = {
      x: -99,
      y: -99
    };
    const spawnPts = [];
    for (let k = 0; k < 12; k++) spawnPts.push([ cx - 5 + k % 6 * 2 + .5, Y1 - 3.5 - Math.floor(k / 6) * 2 ]);
    computeWindowLight(F);
    return {
      building: b,
      seed: opt.seed,
      W,
      H,
      floors: [ F ],
      X0,
      Y0,
      X1,
      Y1,
      stairBlocks: [],
      exits: [ {
        x: cx,
        y: Y1,
        side: "s"
      } ],
      roofIdx: 0,
      escape: null,
      zip: F.zip,
      outdoor: "site",
      spawnPts
    };
  };
  M.buildRaid = function(opt) {
    if (opt.building.outdoor) {
      const lv = opt.building.outdoor === "site" ? M.buildSite(opt) : opt.building.outdoor === "tunnel" ? M.buildTunnel(opt) : M.buildBridge(opt);
      const F0 = lv.floors[0], tr = new SX.Rng(opt.seed * 61 + 7 >>> 0);
      const zones = (F0.zones || []).concat((lv.spawnPts || []).map(q => ({
        x: (q.x != null ? q.x : q[0]) - 2,
        y: (q.y != null ? q.y : q[1]) - 2,
        w: 4,
        h: 4
      })), (lv.exits || []).map(e => ({
        x: e.x - 3,
        y: e.y - 3,
        w: 6,
        h: 6
      })));
      tacStructures(F0, tr, 8 + tr.i(5), {
        x0: lv.X0 + 2,
        y0: lv.Y0 + 3,
        x1: lv.X1 - 3,
        y1: lv.Y1 - 3,
        zones,
        kinds: [ "sandbag", "plate", "sandbag" ],
        anyRoom: true
      });
      if (SX.decoRaid) SX.decoRaid.build(lv, opt);
      return lv;
    }
    const b = opt.building, rng = new SX.Rng(opt.seed);
    const S = M.SIZE, MG = M.MARGIN, W = S + MG * 2, H = S + MG * 2;
    const X0 = MG, Y0 = MG, X1 = MG + S - 1, Y1 = MG + S - 1;
    const floors = [];
    const B = M.BLOCK, C = M.CORR, N = M.N;
    const bx = i => X0 + C + i * (B + C), by = j => Y0 + C + j * (B + C);
    const cor = k => C / 2 + k * (B + C);
    const exits = [ {
      x: X0 + cor(1 + rng.i(N - 1)),
      y: Y1,
      side: "s"
    }, {
      x: X0 + cor(1 + rng.i(N - 1)),
      y: Y0,
      side: "n"
    }, {
      x: X0,
      y: Y0 + cor(1 + rng.i(N - 1)),
      side: "w"
    }, {
      x: X1,
      y: Y0 + cor(1 + rng.i(N - 1)),
      side: "e"
    } ];
    const lobby = (i, j) => {
      const cx = bx(i) + B / 2, cy = by(j) + B / 2;
      return exits.some(e => Math.hypot(cx - e.x, cy - e.y) < B * 1.4);
    };
    const cand = [];
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) if (!lobby(i, j)) cand.push({
      i,
      j
    });
    rng.shuffle(cand);
    const sA = cand[0], sB = cand.slice(1).find(c => Math.abs(c.i - sA.i) + Math.abs(c.j - sA.j) >= 4) || cand[1];
    const stairBlocks = [ {
      i: sA.i,
      j: sA.j,
      roof: true
    }, {
      i: sB.i,
      j: sB.j,
      roof: false
    } ];
    const escF = b.floors > 1 ? 1 + rng.i(b.floors - 1) : -1;
    for (let f = 0; f < b.floors; f++) {
      const F = new Floor(W, H, f, "floor");
      const fr = new SX.Rng(opt.seed * 31 + f * 977);
      if (f === 0) buildStreet(F, fr, X0, Y0, X1, Y1, exits);
      fillRect(F, X0, Y0, X1, Y1, T.FLOOR, FS.CONC, -1);
      for (let y = Y0; y <= Y1; y++) for (let x = X0; x <= X1; x++) F.inside[F.i(x, y)] = 1;
      hwall(F, X0, X1, Y0, 0);
      hwall(F, X0, X1, Y1, 0);
      vwall(F, X0, Y0, Y1, 0);
      vwall(F, X1, Y0, Y1, 0);
      if (!(b.dark && f >= 1)) for (let k = 3; k < S - 3; k += 3) {
        for (const [x, y] of [ [ X0 + k, Y0 ], [ X0 + k, Y1 ], [ X0, Y0 + k ], [ X1, Y0 + k ] ]) if (F.tile(x, y) === T.WALL) F.set(x, y, T.WINDOW);
      }
      if (f === 0) {
        for (const e of exits) {
          const horiz = e.side === "n" || e.side === "s";
          const d = horiz ? addDoor(F, e.x - 2, e.y, true, 4, {
            exit: true,
            side: e.side
          }) : addDoor(F, e.x, e.y - 2, false, 4, {
            exit: true,
            side: e.side
          });
          d.open = true;
        }
      }
      let roomId = 0;
      const addRoom = (x0, y0, x1, y1, extra) => {
        const r = Object.assign({
          id: roomId++,
          x0,
          y0,
          x1,
          y1,
          floor: f
        }, extra || {});
        F.rooms.push(r);
        for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
          const i = F.i(x, y);
          F.room[i] = r.id;
        }
        return r;
      };
      const fixedBlk = (i, j) => !!stairBlocks.find(s => s.i === i && s.j === j) || f === 0 && lobby(i, j);
      const plan = planFloor(b, f, fr, N, fixedBlk);
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
        const x0 = bx(i), y0 = by(j), x1 = x0 + B - 1, y1 = y0 + B - 1;
        const sb = stairBlocks.find(s => s.i === i && s.j === j);
        if (sb) {
          buildStairwell(F, f, b.floors, x0, y0, sb, fr, opt.fire && f === 0 && sb.roof ? b.floors + 1 : null);
          continue;
        }
        if (f === 0 && lobby(i, j)) {
          fillRect(F, x0, y0, x1, y1, T.FLOOR, FS.LOBBY, -1);
          continue;
        }
        const c = plan[j][i];
        if (!c || c.kind === "taken") continue;
        buildBlock(F, fr, c, x0, y0, x1, y1, addRoom, B, C);
      }
      const themeRng = new SX.Rng(opt.seed * 7 + f * 131);
      const grpTheme = new Map;
      for (const r of F.rooms) {
        if (r.themeFixed) r.theme = r.themeFixed; else if (r.grp) {
          if (!grpTheme.has(r.grp)) grpTheme.set(r.grp, rollTheme(themeRng, b.id));
          r.theme = grpTheme.get(r.grp);
        } else r.theme = rollTheme(themeRng, b.id);
        paintRoomFloor(F, r);
      }
      const lootCtx = {
        building: b,
        floor: f,
        intel: opt.intel
      };
      for (const r of F.rooms) furnishRoom(F, r, themeRng, lootCtx);
      furnishCorridors(F, themeRng, f);
      if (b.dark && f >= 1) {
        const lr = new SX.Rng(opt.seed * 53 + f * 17);
        let n = 0;
        for (let t = 0; t < 900 && n < 26; t++) {
          const x = X0 + 2 + lr.i(S - 4), y = Y0 + 2 + lr.i(S - 4);
          if (F.tile(x, y) !== T.FLOOR) continue;
          if (F.lamps.some(l => Math.hypot(l.x - x, l.y - y) < 12)) continue;
          F.lamps.push({
            x: x + .5,
            y: y + .5,
            r: 7 + lr.i(3),
            c: [ 255, 90, 70 ],
            a: .55,
            flicker: lr.chance(.5)
          });
          n++;
        }
      }
      if (f === escF) placeEscape(F, new SX.Rng(opt.seed * 17 + 5), X0, Y0, X1, Y1, stairBlocks.map(s => [ bx(s.i), by(s.j) ]));
      scatterLoot(F, themeRng, lootCtx, f === 0 ? 3 : 6 + f, f);
      if (b.id !== "train") {
        const tr = new SX.Rng(opt.seed * 61 + f * 29 + 7 >>> 0);
        tacStructures(F, tr, 9 + Math.min(4, b.diff || 1) * 2 + tr.i(4));
      }
      computeWindowLight(F);
      floors.push(F);
    }
    vaultSetup(floors, b, opt.seed);
    ctrlSetup(floors, b, opt.seed);
    const roof = buildRoof(W, H, X0, Y0, X1, Y1, b.floors, stairBlocks, bx, by, rng);
    floors.push(roof);
    const esc = escF >= 0 && floors[escF].escape ? Object.assign({
      f: escF
    }, floors[escF].escape) : null;
    const lv = {
      building: b,
      seed: opt.seed,
      W,
      H,
      floors,
      X0,
      Y0,
      X1,
      Y1,
      stairBlocks,
      exits,
      roofIdx: b.floors,
      escape: esc,
      zip: roof.zip
    };
    if (opt.fire) fireSetup(lv, opt);
    if (SX.decoRaid) SX.decoRaid.build(lv, opt);
    return lv;
  };
  function fireSetup(lv, opt) {
    const b = lv.building, floors = lv.floors, W = lv.W, H = lv.H, X0 = lv.X0, Y0 = lv.Y0, X1 = lv.X1, Y1 = lv.Y1, B = M.BLOCK, C = M.CORR;
    const bx = i => X0 + C + i * (B + C), by = j => Y0 + C + j * (B + C);
    const sA = lv.stairBlocks.find(s => s.roof), ax = bx(sA.i), ay = by(sA.j);
    for (const d of floors[0].doors) if (d.exit) {
      d.open = false;
      d.locked = true;
      d.fireShut = true;
    }
    const fg = new SX.Rng(opt.seed * 97 + 31 >>> 0);
    for (const [f, n] of [ [ b.floors - 1, 3 + fg.i(3) ], [ b.floors - 2, 1 + fg.i(2) ] ]) {
      if (f < 1) continue;
      const F = floors[f];
      F.fireAt = new Uint8Array(W * H);
      const rooms = F.rooms.filter(r => !(F.vault && F.vault.r === r) && !(F.ctrl && F.ctrl.r === r) && (r.x1 - r.x0 + 1) * (r.y1 - r.y0 + 1) >= 16);
      fg.shuffle(rooms);
      let made = 0;
      for (const r of rooms) {
        if (made >= n) break;
        const ok = (x, y) => {
          if (x < r.x0 || x > r.x1 || y < r.y0 || y > r.y1) return false;
          const i = F.i(x, y);
          if (F.t[i] !== T.FLOOR || F.solid[i] || F.fireAt[i] || F.room[i] !== r.id) return false;
          if (nearDoor(F, x, y, 1, 1, 2)) return false;
          for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (F.tile(x + dx, y + dy) === T.STAIR) return false;
          return true;
        };
        let sx = -1, sy = -1;
        for (let t = 0; t < 40 && sx < 0; t++) {
          const x = r.x0 + fg.i(r.x1 - r.x0 + 1), y = r.y0 + fg.i(r.y1 - r.y0 + 1);
          if (ok(x, y)) {
            sx = x;
            sy = y;
          }
        }
        if (sx < 0) continue;
        const want = 4 + fg.i(6), cells = [ [ sx, sy ] ];
        F.fireAt[F.i(sx, sy)] = 1;
        for (let t = 0; t < 80 && cells.length < want; t++) {
          const c = cells[fg.i(cells.length)], d = [ [ 1, 0 ], [ -1, 0 ], [ 0, 1 ], [ 0, -1 ] ][fg.i(4)], x = c[0] + d[0], y = c[1] + d[1];
          if (ok(x, y)) {
            F.fireAt[F.i(x, y)] = 1;
            cells.push([ x, y ]);
          }
        }
        let cx = 0, cy = 0;
        for (const [x, y] of cells) {
          addProp(F, "blaze", x, y, {
            v: fg.i(8),
            solid: false,
            tall: false,
            cover: 0
          });
          cx += x;
          cy += y;
        }
        F.lamps.push({
          x: cx / cells.length + .5,
          y: cy / cells.length + .5,
          r: 7,
          c: [ 255, 130, 50 ],
          a: .7,
          flicker: true
        });
        made++;
      }
      F.fires = made;
      if (SX.art.blazeLink) SX.art.blazeLink(F);
    }
    const RF = floors[lv.roofIdx], sg = new SX.Rng(opt.seed * 101 + 57 >>> 0), pts = [];
    for (let k = 0; k < 12; k++) {
      const side = [ "s", "n", "w", "e" ][k % 4], fr = [ .5, .18, .82 ][Math.floor(k / 4)], horiz = side === "s" || side === "n";
      const along = Math.round(horiz ? X0 + (X1 - X0) * fr : Y0 + (Y1 - Y0) * fr);
      const inn = side === "s" ? Y1 - 3 : side === "n" ? Y0 + 3 : side === "w" ? X0 + 3 : X1 - 3;
      let q = null;
      for (let r = 0; r < 14 && !q; r++) for (const da of r ? [ r, -r ] : [ 0 ]) for (let dn = 0; dn <= 2 && !q; dn++) {
        const a = along + da, nn = side === "s" || side === "e" ? inn - dn : inn + dn, x = horiz ? a : nn, y = horiz ? nn : a;
        let ok = true;
        for (let dy = -1; dy <= 1 && ok; dy++) for (let dx = -1; dx <= 1; dx++) {
          const i = RF.i(x + dx, y + dy);
          if (RF.t[i] !== T.GROUND || RF.solid[i]) {
            ok = false;
            break;
          }
        }
        if (ok) q = {
          x,
          y
        };
      }
      if (!q) q = {
        x: horiz ? along : inn,
        y: horiz ? inn : along
      };
      pts.push({
        side,
        x: q.x + .5,
        y: q.y + .5
      });
      if (horiz) addProp(RF, "plankV", q.x, side === "s" ? Y1 - 1 : Y0 - 1, {
        v: sg.i(4),
        solid: false,
        tall: false,
        cover: 0
      }); else addProp(RF, "plankH", side === "e" ? X1 - 1 : X0 - 1, q.y, {
        v: sg.i(4),
        solid: false,
        tall: false,
        cover: 0
      });
    }
    lv.roofSpawns = pts;
    const rng = new SX.Rng(opt.seed * 89 + 13 >>> 0), pk = floors.length;
    const PF = new Floor(W, H, pk, "floor");
    PF.park = true;
    fillRect(PF, X0, Y0, X1, Y1, T.FLOOR, FS.CONC, -1);
    for (let y = Y0; y <= Y1; y++) for (let x = X0; x <= X1; x++) PF.inside[PF.i(x, y)] = 1;
    hwall(PF, X0, X1, Y0, 0);
    hwall(PF, X0, X1, Y1, 0);
    vwall(PF, X0, Y0, Y1, 0);
    vwall(PF, X1, Y0, Y1, 0);
    buildStairwell(PF, -1, b.floors, ax, ay, sA, rng);
    const blk = (x, y, pad) => x >= ax - pad && x < ax + B + pad && y >= ay - pad && y < ay + B + pad + 2;
    const aisleX = i => X0 + 9 + 12 * i, scx = ax + B / 2, scy = ay + B / 2;
    const pickAisle = (yy, minD, not) => {
      const c = [];
      for (let i = 0; i < 11; i++) {
        if (Math.hypot(aisleX(i) + 2.5 - scx, yy - scy) < minD || not != null && Math.abs(i - not) < 4) continue;
        c.push(i);
      }
      return c.length ? c[rng.i(c.length)] : not != null && not < 5 ? 10 : 0;
    };
    const rs = rng.chance(.5) ? "s" : "n", ryz = rs === "s" ? Y1 - 3 : Y0 + 1, eyz = rs === "s" ? Y0 + 1 : Y1 - 3;
    const ri = pickAisle(ryz, 45), ei = pickAisle(eyz, 35, ri);
    const ramp = {
      kind: "park",
      x: aisleX(ri),
      y: ryz,
      w: 5,
      h: 3,
      label: "지하 주차장 출구",
      park: "ramp"
    };
    const emg = {
      kind: "park",
      x: aisleX(ei) + 1,
      y: eyz,
      w: 3,
      h: 3,
      label: "지하 주차장 출구",
      park: "door"
    };
    PF.zones.push(ramp, emg);
    const lines = PF.parkLines = [];
    const ry0 = rs === "s" ? Y1 - 10 : Y0 + 1;
    for (let y = ry0; y < ry0 + 10; y++) for (let x = ramp.x; x < ramp.x + 5; x++) PF.fs[PF.i(x, y)] = FS.ASPH;
    lines.push({
      k: "paintY",
      x: ramp.x * TS + 2,
      y: ry0 * TS,
      w: 3,
      h: 10 * TS
    }, {
      k: "paintY",
      x: (ramp.x + 5) * TS - 5,
      y: ry0 * TS,
      w: 3,
      h: 10 * TS
    });
    const rOut = rs === "s" ? 1 : -1, rwy = rs === "s" ? Y1 : Y0, ewy = rs === "s" ? Y0 : Y1, eOut = -rOut;
    const sky = (F, x0, x1, ya, yb, wy, cov) => {
      for (let y = ya; y <= yb; y++) for (let x = x0; x <= x1; x++) F.inside[F.i(x, y)] = Math.abs(y - wy) <= cov ? 1 : 0;
    };
    {
      const ye = rOut > 0 ? H - 1 : 0, ya = Math.min(rwy, ye), yb = Math.max(rwy, ye);
      vwall(PF, ramp.x - 1, ya, yb, 0);
      vwall(PF, ramp.x + 5, ya, yb, 0);
      fillRect(PF, ramp.x, ya, ramp.x + 4, yb, T.FLOOR, FS.ASPH, -1);
      sky(PF, ramp.x, ramp.x + 4, ya, yb, rwy, 6);
      lines.push({
        k: "paintY",
        x: ramp.x * TS + 2,
        y: ya * TS,
        w: 3,
        h: (yb - ya + 1) * TS
      }, {
        k: "paintY",
        x: (ramp.x + 5) * TS - 5,
        y: ya * TS,
        w: 3,
        h: (yb - ya + 1) * TS
      });
      for (let k = 2; k <= Math.abs(ye - rwy); k += 3) lines.push({
        k: "paintWd",
        x: (ramp.x + 2.5) * TS - 1,
        y: (rwy + rOut * k) * TS,
        w: 3,
        h: TS
      });
      addProp(PF, "parkGate", ramp.x, rwy, {
        v: rOut > 0 ? 1 : 0,
        solid: false,
        tall: false,
        cover: 0
      });
      ramp.y = rOut > 0 ? rwy + 5 : rwy - 7;
      PF.lamps.push({
        x: ramp.x + 2.5,
        y: rwy + rOut * 3 + .5,
        r: 6,
        c: [ 200, 225, 255 ],
        a: .38,
        flicker: false
      });
    }
    {
      const ye = eOut > 0 ? H - 1 : 0, ya = Math.min(ewy + eOut, ye), yb = Math.max(ewy + eOut, ye);
      vwall(PF, emg.x - 1, ya, yb, 0);
      vwall(PF, emg.x + 4, ya, yb, 0);
      fillRect(PF, emg.x, ya, emg.x + 3, yb, T.FLOOR, FS.CONC, -1);
      for (let k = 1; k <= 5; k++) for (let x = emg.x; x <= emg.x + 3; x++) PF.fs[PF.i(x, ewy + eOut * k)] = FS.STAIR;
      sky(PF, emg.x, emg.x + 3, ya, yb, ewy, 3);
      addDoor(PF, emg.x + 1, ewy, true, 2, {
        parkExit: true
      });
      addProp(PF, "exitSign", emg.x + 1, ewy, {
        solid: false,
        tall: false,
        cover: 0
      });
      emg.w = 4;
      emg.y = eOut > 0 ? ewy + 3 : ewy - 5;
    }
    const ctx = {
      building: b,
      floor: 0,
      intel: opt.intel
    };
    let nTrunk = 0;
    for (let i = 0; i < 11; i++) {
      const px = X0 + 5 + 12 * i;
      for (let j = 0; j < 16; j++) {
        const py = Y0 + 5 + 8 * j;
        if (!blk(px, py, 1)) addProp(PF, "pillar", px, py, {
          v: 100 + rng.i(6)
        });
        if (j === 15) continue;
        if (!blk(px, py + 4, 1)) lines.push({
          k: "paintW",
          x: px * TS + 15,
          y: (py + 1) * TS,
          w: 2,
          h: 6 * TS
        });
        for (let s = 0; s < 3; s++) {
          const sy = py + 1 + s * 2;
          for (const sx of [ px - 3, px + 1 ]) {
            if (blk(sx, sy, 1) || blk(sx + 2, sy + 1, 1)) continue;
            lines.push({
              k: "paintW",
              x: sx * TS + 2,
              y: sy * TS,
              w: 3 * TS - 4,
              h: 2
            });
            if (s === 2) lines.push({
              k: "paintW",
              x: sx * TS + 2,
              y: (sy + 2) * TS - 2,
              w: 3 * TS - 4,
              h: 2
            });
            if (rng.chance(.15) && freeRect(PF, sx, sy, 3, 2, 0)) {
              const o = {
                v: rng.i(12),
                solid: true,
                cover: .9
              };
              if (nTrunk < 7 && rng.chance(.06)) {
                const c = mkCont("crate", SX.items.rollContainer(rng, "crate", ctx), rng);
                c.name = "자동차 트렁크";
                o.cont = c;
                nTrunk++;
              }
              addProp(PF, "car", sx, sy, o);
            }
          }
        }
      }
    }
    for (let i = 0; i < 11; i++) for (let y = Y0 + 9; y < Y1 - 4; y += 16) {
      const x = aisleX(i) + 2.5;
      if (blk(x, y, 0) || !rng.chance(.4)) continue;
      PF.lamps.push({
        x,
        y: y + .5,
        r: 8,
        c: [ 200, 225, 255 ],
        a: .42,
        flicker: rng.chance(.35)
      });
    }
    for (let k = 0; k < 14; k++) {
      const side = rng.i(4), a = 6 + rng.i(X1 - X0 - 12);
      const x = side === 2 ? X0 + 1.5 : side === 3 ? X1 - .5 : X0 + a + .5, y = side === 0 ? Y0 + 1.5 : side === 1 ? Y1 - .5 : Y0 + a + .5;
      PF.lamps.push({
        x,
        y,
        r: 6,
        c: [ 255, 70, 50 ],
        a: .5,
        flicker: rng.chance(.5)
      });
    }
    for (const z of [ ramp, emg ]) PF.lamps.push({
      x: z.x + z.w / 2,
      y: z.y + z.h / 2,
      r: 7,
      c: [ 70, 255, 130 ],
      a: .6,
      flicker: false
    });
    computeWindowLight(PF);
    floors.push(PF);
    lv.parkIdx = pk;
  }
  function doorsOf(F, r) {
    return F.doors.filter(d => d.tiles.some(i => {
      const x = i % F.W, y = Math.floor(i / F.W);
      return d.horiz ? x >= r.x0 && x <= r.x1 && (y === r.y0 - 1 || y === r.y1 + 1) : y >= r.y0 && y <= r.y1 && (x === r.x0 - 1 || x === r.x1 + 1);
    }));
  }
  function vaultSetup(floors, b, seed) {
    const I = SX.items, V = SX.vault;
    if (V && I.KEY_P) for (const F of floors) for (const pr of F.props) {
      const c = pr.cont, p = c && I.KEY_P[c.type];
      if (!p || b.train) continue;
      const tr = new SX.Rng(SX.hash("key:" + (seed >>> 0) + ":" + F.idx + ":" + Math.round(pr.x * 4) + ":" + Math.round(pr.y * 4)));
      if (tr.f() < p) {
        const k = V.pickKey(tr, b.id);
        if (k) I.putGrow(c.grid, I.mk(k));
      }
    }
    const kr = V && V.keyRoomOf(b.id);
    if (!kr) return null;
    const rng = new SX.Rng(SX.hash("vault:" + (seed >>> 0) + ":" + b.id));
    const sz = SX.art.propSize("safe");
    if (!sz) return null;
    const order = [ floors.length - 1 ];
    for (const fi of order) {
      const F = floors[fi];
      const cand = rng.shuffle(F.rooms.filter(r => !r.part && !r.nook && !r.open && !r.hall && !r.big && !r.grp && (r.x1 - r.x0 + 1) * (r.y1 - r.y0 + 1) >= 24));
      for (const r of cand) {
        const ds = doorsOf(F, r);
        if (ds.length !== 1 || ds[0].exit || ds[0].locked) continue;
        const inR = (x, y, w, h) => x < r.x1 + 1 && x + w > r.x0 && y < r.y1 + 1 && y + h > r.y0;
        if (F.stairs.some(q => inR(q.x, q.y, q.w, q.h)) || F.zones.some(z => inR(z.x, z.y, z.w, z.h))) continue;
        const sp = spot(F, r, rng, sz.fw, sz.fh, true);
        if (!sp) continue;
        const cont = mkCont("vault", V.rollVault(new SX.Rng(SX.hash("vaultLoot:" + (seed >>> 0) + ":" + b.id)), kr), rng);
        addProp(F, "safe", sp.x, sp.y, {
          cont,
          v: 0
        });
        const d = ds[0];
        d.locked = true;
        d.open = false;
        d.key = kr.key;
        d.vault = kr.room;
        r.vault = kr.room;
        F.vault = {
          r,
          room: kr.room,
          key: kr.key,
          door: d
        };
        return F.vault;
      }
    }
    return null;
  }
  M.vaultSetup = vaultSetup;
  M.CTRL = {
    b: "metro",
    key: "관제실 열쇠",
    room: "관제실"
  };
  function ctrlSetup(floors, b, seed) {
    const C = M.CTRL;
    if (b.id !== C.b || b.train) return null;
    const sz = SX.art.propSize("cubeDesk");
    if (!sz) return null;
    const rng = new SX.Rng(SX.hash("ctrl:" + (seed >>> 0) + ":" + b.id));
    for (const fi of [ floors.length - 1 ]) {
      const F = floors[fi];
      const cand = rng.shuffle(F.rooms.filter(r => !r.part && !r.nook && !r.open && !r.hall && !r.big && !r.grp && !r.vault && (r.x1 - r.x0 + 1) * (r.y1 - r.y0 + 1) >= 24));
      for (const r of cand) {
        const ds = doorsOf(F, r);
        if (ds.length !== 1 || ds[0].exit || ds[0].locked) continue;
        const inR = (x, y, w, h) => x < r.x1 + 1 && x + w > r.x0 && y < r.y1 + 1 && y + h > r.y0;
        if (F.stairs.some(q => inR(q.x, q.y, q.w, q.h)) || F.zones.some(z => inR(z.x, z.y, z.w, z.h))) continue;
        const sp = spot(F, r, rng, sz.fw, sz.fh, true);
        if (!sp) continue;
        const pr = addProp(F, "cubeDesk", sp.x, sp.y, {
          v: 0
        });
        if (!pr) continue;
        pr.ctrl = true;
        const d = ds[0];
        d.locked = true;
        d.open = false;
        d.key = C.key;
        d.vault = C.room;
        d.keep = true;
        r.vault = C.room;
        r.ctrl = true;
        F.ctrl = {
          r,
          room: C.room,
          key: C.key,
          door: d,
          prop: pr
        };
        return F.ctrl;
      }
    }
    return null;
  }
  M.ctrlSetup = ctrlSetup;
  function placeEscape(F, rng, X0, Y0, X1, Y1, stairs) {
    const kind = SX.art.propSize("escape") ? "escape" : "zipline";
    for (let t = 0; t < 400; t++) {
      const side = rng.i(4), k = 6 + rng.i(M.SIZE - 12);
      let x, y, zx, zy;
      if (side === 0) {
        x = X0 + k;
        y = Y0 + 1;
        zx = x - 1;
        zy = y + 1;
      } else if (side === 1) {
        x = X0 + k;
        y = Y1 - 1;
        zx = x - 1;
        zy = y - 3;
      } else if (side === 2) {
        x = X0 + 1;
        y = Y0 + k;
        zx = x + 1;
        zy = y - 1;
      } else {
        x = X1 - 1;
        y = Y0 + k;
        zx = x - 3;
        zy = y - 1;
      }
      if (stairs.some(([sx, sy]) => x > sx - 6 && x < sx + M.BLOCK + 6 && y > sy - 6 && y < sy + M.BLOCK + 6)) continue;
      let ok = freeRect(F, x, y, 1, 1, 0);
      for (let yy = zy; ok && yy < zy + 3; yy++) for (let xx = zx; ok && xx < zx + 3; xx++) {
        const tt = F.tile(xx, yy);
        if (tt !== T.FLOOR || F.solid[F.i(xx, yy)]) ok = false;
      }
      if (!ok) continue;
      addProp(F, kind, x, y, {
        solid: true,
        cover: .5
      });
      F.zones.push({
        kind: "escape",
        x: zx,
        y: zy,
        w: 3,
        h: 3,
        label: "완강기"
      });
      F.escape = {
        x: x + .5,
        y: y + .5
      };
      return true;
    }
    return false;
  }
  const PLANS = {
    villa: f => ({
      blocks: [ [ "quad", .55 ], [ "split", .25 ], [ "plain", .2 ] ],
      quad: [ "bunk", "kitchen", "toilet", "store" ]
    }),
    office: f => ({
      blocks: [ [ "open", f ? .3 : .15 ], [ "split", .35 ], [ "bent", .2 ], [ "plain", .3 ] ],
      open: [ "cubicles" ],
      hall2: f === 1 || f === 3 ? {
        n: 1,
        themes: [ "meeting" ]
      } : null
    }),
    mall: f => ({
      blocks: [ [ "wardrow", .45 ], [ "split", .2 ], [ "plain", .35 ] ],
      wardrow: [ "shop", "shop", "store" ],
      hall2: f <= 2 ? {
        n: 1,
        themes: [ "atrium" ]
      } : null
    }),
    hos: f => ({
      blocks: [ [ "wardrow", .5 ], [ "split", .2 ], [ "bent", .1 ], [ "plain", .2 ] ],
      wardrow: [ "ward", "ward", "surgery" ],
      hall2: f === 0 ? {
        n: 1,
        themes: [ "reception" ]
      } : null
    }),
    school: f => ({
      blocks: [ [ "split", .7 ], [ "bent", .1 ], [ "plain", .2 ] ],
      hall2: f <= 1 ? {
        n: 1,
        themes: [ f === 0 ? "gym" : "cafeteria" ]
      } : null
    }),
    metro: f => ({
      blocks: [ [ "open", f ? .25 : .45 ], [ "plain", .4 ], [ "split", .35 ] ],
      open: [ f ? "platform" : "concourse" ],
      hall2: f ? {
        n: 2,
        themes: [ "platform" ]
      } : {
        n: 1,
        themes: [ "concourse" ]
      }
    }),
    base: f => ({
      blocks: f === 0 ? [ [ "open", .4 ], [ "plain", .35 ], [ "split", .25 ] ] : [ [ "wardrow", .45 ], [ "split", .25 ], [ "plain", .3 ] ],
      open: [ "motor", "yard" ],
      wardrow: [ "barracks", "barracks", "command" ],
      hall2: f === 1 ? {
        n: 1,
        themes: [ "mess" ]
      } : null
    })
  };
  M.PLANS = PLANS;
  function planFloor(b, f, rng, N, fixed) {
    const P = Array.from({
      length: N
    }, () => Array(N).fill(null));
    const W = PLANS[b.id] ? PLANS[b.id](f) : null;
    const cyc = (list, k) => list && list.length ? list[k % list.length] : null;
    if (W && W.hall2 && W.hall2.n > 0) {
      const cands = [];
      for (let j = 0; j < N; j++) for (let i = 0; i < N - 1; i++) if (!fixed(i, j) && !fixed(i + 1, j)) cands.push([ i, j ]);
      rng.shuffle(cands);
      let n = W.hall2.n, k = 0;
      for (const [i, j] of cands) {
        if (n <= 0) break;
        if (P[j][i] || P[j][i + 1]) continue;
        P[j][i] = {
          kind: "hall2",
          theme: cyc(W.hall2.themes, k++)
        };
        P[j][i + 1] = {
          kind: "taken"
        };
        n--;
      }
    }
    const LAY = {
      classrooms: [ .78, .78 ],
      halls: [ .22, .22 ],
      barracks: [ .3, .5 ]
    }[b.layout] || [ .4, .75 ];
    let k = 0;
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      if (fixed(i, j) || P[j][i]) continue;
      let kind;
      if (W) {
        let r = rng.f();
        kind = "plain";
        for (const [kk, w] of W.blocks) {
          if ((r -= w) <= 0) {
            kind = kk;
            break;
          }
        }
      } else {
        const r = rng.f();
        kind = r < LAY[0] ? "split" : r < LAY[1] ? "bent" : "plain";
      }
      const c = {
        kind
      };
      if (kind === "open") c.theme = cyc(W.open, k++);
      if (kind === "quad") c.themes = W.quad;
      if (kind === "wardrow") c.themes = W.wardrow;
      P[j][i] = c;
    }
    return P;
  }
  function buildBlock(F, rng, c, x0, y0, x1, y1, addRoom, B, C) {
    if (c.kind === "split") {
      const vert = rng.chance(.5);
      if (vert) {
        const a1 = x0 + 7, b0 = x0 + 10;
        plainRoom(F, rng, x0, y0, a1, y1, addRoom);
        plainRoom(F, rng, b0, y0, x1, y1, addRoom);
        fillRect(F, a1 + 1, y0, b0 - 1, y1, T.FLOOR, FS.CONC, -1);
      } else {
        const a1 = y0 + 7, b0 = y0 + 10;
        plainRoom(F, rng, x0, y0, x1, a1, addRoom);
        plainRoom(F, rng, x0, b0, x1, y1, addRoom);
        fillRect(F, x0, a1 + 1, x1, b0 - 1, T.FLOOR, FS.CONC, -1);
      }
    } else if (c.kind === "bent") bentRoom(F, rng, x0, y0, addRoom); else if (c.kind === "quad") {
      const th = c.themes ? c.themes.slice() : [];
      rng.shuffle(th);
      const rects = [ [ x0, y0, x0 + 7, y0 + 7 ], [ x0 + 10, y0, x1, y0 + 7 ], [ x0, y0 + 10, x0 + 7, y1 ], [ x0 + 10, y0 + 10, x1, y1 ] ];
      rects.forEach(([a, b2, cx, d], k) => {
        const r = plainRoom(F, rng, a, b2, cx, d, addRoom);
        if (th[k]) r.themeFixed = th[k];
      });
    } else if (c.kind === "wardrow") {
      const side = rng.chance(.5) ? 0 : 1, th = c.themes || [];
      const rects = [ [ x0, x0 + 6 ], [ x0 + 6, x0 + 12 ], [ x0 + 12, x1 ] ];
      rects.forEach(([a, b2], k) => {
        const r = plainRoomSide(F, rng, a, y0, b2, y1, addRoom, side);
        if (th[k]) r.themeFixed = th[k];
      });
    } else if (c.kind === "open" && c.theme === "cubicles") {
      hwall(F, x0, x1, y0, 0);
      hwall(F, x0, x1, y1, 0);
      vwall(F, x0, y0, y1, 0);
      vwall(F, x1, y0, y1, 0);
      if (rng.chance(.5)) {
        doorOnSeg(F, true, y0, x0 + 1, x1 - 1);
        doorOnSeg(F, true, y1, x0 + 1, x1 - 1);
      } else {
        doorOnSeg(F, false, x0, y0 + 1, y1 - 1);
        doorOnSeg(F, false, x1, y0 + 1, y1 - 1);
      }
      addRoom(x0 + 1, y0 + 1, x1 - 1, y1 - 1, {
        big: "cubicles",
        themeFixed: "cubicles"
      });
    } else if (c.kind === "open") {
      const r = addRoom(x0, y0, x1, y1, {
        big: c.theme || "open",
        themeFixed: c.theme || "none",
        open: true
      });
    } else if (c.kind === "hall2") {
      const xb = x1 + C + B;
      hwall(F, x0, xb, y0, 0);
      hwall(F, x0, xb, y1, 0);
      vwall(F, x0, y0, y1, 0);
      vwall(F, xb, y0, y1, 0);
      doorOnSeg(F, true, y0, x0 + 1, x1 - 1);
      doorOnSeg(F, true, y0, x1 + C + 1, xb - 1);
      doorOnSeg(F, true, y1, x0 + 1, x1 - 1);
      doorOnSeg(F, true, y1, x1 + C + 1, xb - 1);
      doorOnSeg(F, false, x0, y0 + 1, y1 - 1);
      doorOnSeg(F, false, xb, y0 + 1, y1 - 1);
      addRoom(x0 + 1, y0 + 1, xb - 1, y1 - 1, {
        big: c.theme || "hall",
        themeFixed: c.theme || "none",
        hall: true
      });
    } else plainRoom(F, rng, x0, y0, x1, y1, addRoom);
  }
  function plainRoomSide(F, rng, x0, y0, x1, y1, addRoom, side) {
    hwall(F, x0, x1, y0, 0);
    hwall(F, x0, x1, y1, 0);
    vwall(F, x0, y0, y1, 0);
    vwall(F, x1, y0, y1, 0);
    if (side === 0) doorOnSeg(F, true, y0, x0 + 1, x1 - 1); else doorOnSeg(F, true, y1, x0 + 1, x1 - 1);
    return addRoom(x0 + 1, y0 + 1, x1 - 1, y1 - 1);
  }
  function plainRoom(F, rng, x0, y0, x1, y1, addRoom) {
    hwall(F, x0, x1, y0, 0);
    hwall(F, x0, x1, y1, 0);
    vwall(F, x0, y0, y1, 0);
    vwall(F, x1, y0, y1, 0);
    const side = rng.i(4);
    if (side === 0) doorOnSeg(F, true, y0, x0 + 1, x1 - 1); else if (side === 1) doorOnSeg(F, true, y1, x0 + 1, x1 - 1); else if (side === 2) doorOnSeg(F, false, x0, y0 + 1, y1 - 1); else doorOnSeg(F, false, x1, y0 + 1, y1 - 1);
    return addRoom(x0 + 1, y0 + 1, x1 - 1, y1 - 1);
  }
  function bentRoom(F, rng, x0, y0, addRoom) {
    const B = M.BLOCK, R = B - 1;
    const L = rng.chance(.62);
    const swap = rng.chance(.5), fx = rng.chance(.5), fy = rng.chance(.5);
    const P = (u, v) => {
      const a = swap ? v : u, b = swap ? u : v;
      return [ fx ? x0 + R - a : x0 + a, fy ? y0 + R - b : y0 + b ];
    };
    const seg = (u0, v0, u1, v1, door) => {
      const [ax, ay] = P(u0, v0), [bx2, by2] = P(u1, v1);
      if (ay === by2) {
        hwall(F, Math.min(ax, bx2), Math.max(ax, bx2), ay, 0);
        if (door) doorOnSeg(F, true, ay, Math.min(ax, bx2) + 1, Math.max(ax, bx2) - 1);
      } else {
        vwall(F, ax, Math.min(ay, by2), Math.max(ay, by2), 0);
        if (door) doorOnSeg(F, false, ax, Math.min(ay, by2) + 1, Math.max(ay, by2) - 1);
      }
    };
    const rect = (u0, v0, u1, v1) => {
      const [ax, ay] = P(u0, v0), [bx2, by2] = P(u1, v1);
      return [ Math.min(ax, bx2), Math.min(ay, by2), Math.max(ax, bx2), Math.max(ay, by2) ];
    };
    const grp = {
      kind: L ? "L" : "U",
      parts: []
    };
    const part = (u0, v0, u1, v1) => {
      const [a, b2, c, d] = rect(u0, v0, u1, v1);
      const r = addRoom(a, b2, c, d, {
        part: true,
        grp
      });
      grp.parts.push(r);
    };
    if (L) {
      const s = 7;
      const cd = rng.i(2), ld = rng.i(4);
      seg(0, 0, s, 0, cd === 0);
      seg(s, 0, R, 0, ld === 0);
      seg(0, 0, 0, s, cd === 1);
      seg(0, s, 0, R, ld === 1);
      seg(0, R, R, R, ld === 2);
      seg(R, 0, R, R, ld === 3);
      seg(0, s, s, s, false);
      seg(s, 0, s, s, false);
      const [a, b2, c, d] = rect(1, 1, s - 1, s - 1);
      grp.nook = addRoom(a, b2, c, d, {
        nook: grp
      });
      part(s + 1, 1, R - 1, R - 1);
      part(1, s + 1, s, R - 1);
    } else {
      const n0 = 6, n1 = 11, nd = 7;
      const ud = rng.i(3);
      seg(0, 0, n0, 0, false);
      seg(n0, 0, n1, 0, true);
      seg(n1, 0, R, 0, false);
      seg(0, R, R, R, ud === 0);
      seg(0, 0, 0, R, ud === 1);
      seg(R, 0, R, R, ud === 2);
      seg(n0, 0, n0, nd, false);
      seg(n1, 0, n1, nd, false);
      seg(n0, nd, n1, nd, false);
      const [a, b2, c, d] = rect(n0 + 1, 1, n1 - 1, nd - 1);
      grp.nook = addRoom(a, b2, c, d, {
        nook: grp
      });
      part(1, 1, n0 - 1, R - 1);
      part(n1 + 1, 1, R - 1, R - 1);
      part(n0, nd + 1, n1, R - 1);
    }
  }
  function buildStairwell(F, f, nFloors, x0, y0, sb, rng, park) {
    const B = M.BLOCK;
    fillRect(F, x0, y0, x0 + B - 1, y0 + B - 1, T.FLOOR, FS.CONC, -1);
    hwall(F, x0, x0 + B - 1, y0, 0);
    vwall(F, x0, y0, y0 + B - 1, 0);
    vwall(F, x0 + B - 1, y0, y0 + B - 1, 0);
    doorOnSeg(F, true, y0, x0 + 1, x0 + B - 2);
    const sx = x0 + 3, sy = y0 + 4, sw = 4, sl = 8;
    const upOK = f < nFloors - 1 || sb.roof, downOK = f > 0 || park != null;
    if (upOK) {
      fillRect(F, sx, sy, sx + sw - 1, sy + sl - 1, T.STAIR, FS.STAIR, -1);
      F.stairs.push({
        x: sx,
        y: sy,
        w: sw,
        h: sl,
        dir: "up",
        to: f + 1,
        key: sb.i + ":" + sb.j
      });
      vwall(F, sx - 1, sy, sy + sl - 1, 0);
    }
    const dx = x0 + B - 3 - sw;
    if (downOK) {
      fillRect(F, dx, sy, dx + sw - 1, sy + sl - 1, T.STAIR, FS.STAIR, -1);
      F.stairs.push({
        x: dx,
        y: sy,
        w: sw,
        h: sl,
        dir: "down",
        to: f > 0 ? f - 1 : park,
        key: sb.i + ":" + sb.j
      });
      vwall(F, dx + sw, sy, sy + sl - 1, 0);
    }
    addProp(F, "sign", x0 + 7, y0 + 1, {
      v: 1
    });
  }
  function buildStreet(F, rng, X0, Y0, X1, Y1, exits) {
    const W = F.W, H = F.H;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const d = Math.max(X0 - x, x - X1, Y0 - y, y - Y1);
      let fs = FS.ASPH;
      if (d <= 3) fs = FS.WALK; else if (d >= 10) fs = FS.WALK; else if (d === 6 || d === 7) {
        fs = FS.LANE;
      }
      if (d > 11) {
        F.set(x, y, T.VOID, FS.GRASS);
        continue;
      }
      F.set(x, y, T.GROUND, fs);
    }
    for (let k = 4; k < M.SIZE; k += 7) {
      for (const [x, y] of [ [ X0 + k, Y0 - 2 ], [ X0 + k, Y1 + 2 ], [ X0 - 2, Y0 + k ], [ X1 + 2, Y0 + k ] ]) {
        if (rng.chance(.5)) addProp(F, rng.chance(.6) ? "tree" : "lamp", x, y, {
          v: rng.i(9)
        });
      }
    }
    for (let n = 0; n < 34; n++) {
      const side = rng.i(4), k = 6 + rng.i(M.SIZE - 12);
      const ex = exits.find(e => e.side === [ "n", "s", "w", "e" ][side]);
      if (ex && Math.abs(side < 2 ? X0 + k - ex.x : Y0 + k - ex.y) < 7) continue;
      const off = 5 + rng.i(3);
      let x, y;
      if (side === 0) {
        x = X0 + k;
        y = Y0 - off - 1;
      } else if (side === 1) {
        x = X0 + k;
        y = Y1 + off;
      } else if (side === 2) {
        x = X0 - off - 2;
        y = Y0 + k;
      } else {
        x = X1 + off;
        y = Y0 + k;
      }
      addProp(F, rng.chance(.08) ? "bus" : "car", x, y, {
        v: rng.i(12),
        solid: true,
        cover: .9
      });
    }
    for (const e of exits.slice(0, 2)) addProp(F, "hydrant", Math.round(e.x) + 6, e.side === "s" ? Y1 + 2 : Y0 - 3, {
      solid: true
    });
    if (SX.art.propSize("bigBoard")) for (const [side, y] of [ [ "n", Y0 - 3 ], [ "s", Y1 + 10 ] ]) {
      const ex = exits.find(e => e.side === side);
      for (const fx of [ .22, .68 ]) {
        const tall = x => F.props.some(p => (p.kind === "tree" || p.kind === "lamp" || p.kind === "hydrant") && p.x >= x - 1 && p.x <= x + 4 && Math.abs(p.y - y) <= 2);
        for (const dx of [ 0, 2, -2, 4, -4 ]) {
          const x = Math.round(X0 + (X1 - X0) * fx) + dx;
          if (ex && Math.abs(x + 2 - ex.x) < 9) continue;
          if (!tall(x) && freeRect(F, x, y, 4, 1, 0)) {
            addProp(F, "bigBoard", x, y, {
              solid: false
            });
            break;
          }
        }
      }
    }
  }
  function buildRoof(W, H, X0, Y0, X1, Y1, nFloors, stairBlocks, bx, by, rng) {
    const F = new Floor(W, H, nFloors, "roof");
    fillRect(F, X0, Y0, X1, Y1, T.GROUND, FS.ROOF, -1);
    hwall(F, X0, X1, Y0, 0);
    hwall(F, X0, X1, Y1, 0);
    vwall(F, X0, Y0, Y1, 0);
    vwall(F, X1, Y0, Y1, 0);
    for (let y = Y0; y <= Y1; y++) for (let x = X0; x <= X1; x++) if (F.tile(x, y) === T.WALL) F.set(x, y, T.PARAPET);
    const sb = stairBlocks.find(s => s.roof), x0 = bx(sb.i), y0 = by(sb.j), B = M.BLOCK;
    const hx0 = x0 + 1, hy0 = y0 + 2, hx1 = x0 + 9, hy1 = y0 + 13;
    fillRect(F, hx0, hy0, hx1, hy1, T.FLOOR, FS.CONC, -1);
    hwall(F, hx0, hx1, hy0, 0);
    vwall(F, hx0, hy0, hy1, 0);
    vwall(F, hx1, hy0, hy1, 0);
    hwall(F, hx0, hx1, hy1, 0);
    doorOnSeg(F, true, hy1, hx0 + 1, hx1 - 1).open = true;
    for (let y = hy0; y <= hy1; y++) for (let x = hx0; x <= hx1; x++) F.inside[F.i(x, y)] = 1;
    const sx = x0 + 3, sy = y0 + 4;
    fillRect(F, sx, sy, sx + 3, sy + 7, T.STAIR, FS.STAIR, -1);
    F.stairs.push({
      x: sx,
      y: sy,
      w: 4,
      h: 8,
      dir: "down",
      to: nFloors - 1,
      key: sb.i + ":" + sb.j
    });
    const nearHut = (x, y, w, h) => x + w > hx0 - 4 && x < hx1 + 4 && y + h > hy0 - 4 && y < hy1 + 6;
    const spotOk = (x, y, w, h) => {
      if (nearHut(x, y, w, h)) return false;
      for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) {
        if (F.tile(xx, yy) !== T.GROUND || F.solid[F.i(xx, yy)]) return false;
      }
      return true;
    };
    const put = (kind, x, y, cover) => {
      const sz = SX.art.propSize(kind) || {
        fw: 1,
        fh: 1
      };
      if (!spotOk(x, y, sz.fw, sz.fh)) return false;
      addProp(F, kind, x, y, {
        solid: true,
        cover,
        tall: false,
        v: rng.i(8)
      });
      return true;
    };
    const cluster = (cx, cy) => {
      const k = rng.i(6);
      if (k === 0) {
        const m = 1 + rng.i(3);
        for (let j = 0; j < m; j++) put("ac", cx + j * (2 + rng.i(2)), cy, .8);
      } else if (k === 1) {
        put("tank", cx, cy, .9);
        put("drum", cx + 2, cy + 1, .7);
        if (rng.chance(.5)) put("drum", cx - 1, cy + 1, .7);
      } else if (k === 2) {
        const m = 3 + rng.i(4);
        for (let j = 0; j < m; j++) put(rng.chance(.7) ? "crate" : "boxes", cx + rng.i(3), cy + rng.i(2), .65);
      } else if (k === 3) {
        const m = 2 + rng.i(3);
        for (let j = 0; j < m; j++) put("drum", cx + j, cy + (rng.chance(.3) ? 1 : 0), .7);
      } else if (k === 4) {
        const m = 2 + rng.i(3), vert = rng.chance(.4);
        for (let j = 0; j < m; j++) put("barrier", cx + (vert ? 0 : j * 2), cy + (vert ? j : 0), .85);
      } else {
        put("crate", cx, cy, .65);
        put("drum", cx + 1, cy, .7);
        put("ac", cx + 2, cy - 1, .8);
      }
    };
    for (let n = 0; n < 150; n++) cluster(X0 + 4 + rng.i(M.SIZE - 10), Y0 + 4 + rng.i(M.SIZE - 10));
    const hcx = (hx0 + hx1) / 2, hcy = (hy0 + hy1) / 2;
    let zp = null;
    for (let t = 0; t < 200 && !zp; t++) {
      const side = rng.i(4), k = 8 + rng.i(M.SIZE - 16);
      let px, py, zx, zy, zw, zh;
      if (side === 0) {
        px = X0 + k;
        py = Y0 + 1;
        zx = px - 3;
        zy = py + 1;
        zw = 7;
        zh = 5;
      } else if (side === 1) {
        px = X0 + k;
        py = Y1 - 1;
        zx = px - 3;
        zy = py - 5;
        zw = 7;
        zh = 5;
      } else if (side === 2) {
        px = X0 + 1;
        py = Y0 + k;
        zx = px + 1;
        zy = py - 3;
        zw = 5;
        zh = 7;
      } else {
        px = X1 - 1;
        py = Y0 + k;
        zx = px - 5;
        zy = py - 3;
        zw = 5;
        zh = 7;
      }
      if (Math.hypot(px - hcx, py - hcy) < 40 && t < 150) continue;
      let ok = true;
      for (let yy = Math.min(zy, py); ok && yy <= Math.max(zy + zh - 1, py); yy++) for (let xx = Math.min(zx, px); ok && xx <= Math.max(zx + zw - 1, px); xx++) {
        if (F.tile(xx, yy) !== T.GROUND || F.solid[F.i(xx, yy)]) ok = false;
      }
      if (ok) zp = {
        px,
        py,
        zx,
        zy,
        zw,
        zh
      };
    }
    if (!zp) zp = {
      px: X1 - 6,
      py: Y1 - 3,
      zx: X1 - 9,
      zy: Y1 - 8,
      zw: 7,
      zh: 5
    };
    for (let yy = zp.zy - 2; yy < zp.zy + zp.zh + 2; yy++) for (let xx = zp.zx - 2; xx < zp.zx + zp.zw + 2; xx++) {
      if (!F.in(xx, yy)) continue;
      const q = F.propAt[F.i(xx, yy)];
      if (q) M.removeProp(F, q);
    }
    addProp(F, "zipline", zp.px, zp.py, {
      solid: true
    });
    F.zones.push({
      kind: "zip",
      x: zp.zx,
      y: zp.zy,
      w: zp.zw,
      h: zp.zh,
      label: "집라인"
    });
    F.zip = {
      x: zp.px + .5,
      y: zp.py + .5,
      zone: {
        x: zp.zx,
        y: zp.zy,
        w: zp.zw,
        h: zp.zh
      }
    };
    F.hut = {
      x: hcx,
      y: hcy
    };
    const zc = {
      x: zp.zx + zp.zw / 2,
      y: zp.zy + zp.zh / 2
    };
    for (let n = 0, t = 0; n < 18 && t < 200; t++) {
      const a = rng.f() * Math.PI * 2, r = 7 + rng.f() * 24, cx = Math.round(zc.x + Math.cos(a) * r), cy = Math.round(zc.y + Math.sin(a) * r);
      if (cx > zp.zx - 6 && cx < zp.zx + zp.zw + 4 && cy > zp.zy - 6 && cy < zp.zy + zp.zh + 4) continue;
      cluster(cx, cy);
      n++;
    }
    if (SX.art.propSize("bigBoard")) for (const fx of [ .25, .65 ]) {
      const x = Math.round(X0 + (X1 - X0) * fx), y = Y0 + 1;
      if (x + 4 > zp.zx - 3 && x < zp.zx + zp.zw + 3 && y < zp.zy + zp.zh + 3) continue;
      if (freeRect(F, x, y, 4, 1, 0)) addProp(F, "bigBoard", x, y, {
        solid: false
      });
    }
    return F;
  }
  const THEMES = {
    villa: [ [ "bunk", .42 ], [ "kitchen", .34 ], [ "store", .16 ], [ "none", .08 ] ],
    office: [ [ "office", .38 ], [ "meeting", .18 ], [ "pantry", .18 ], [ "store", .18 ], [ "none", .08 ] ],
    mall: [ [ "shop", .36 ], [ "store", .34 ], [ "pantry", .12 ], [ "office", .1 ], [ "none", .08 ] ],
    hos: [ [ "ward", .38 ], [ "surgery", .16 ], [ "office", .14 ], [ "store", .16 ], [ "pantry", .08 ], [ "none", .08 ] ],
    school: [ [ "classroom", .46 ], [ "library", .1 ], [ "lab", .12 ], [ "cafeteria", .08 ], [ "office", .1 ], [ "store", .08 ], [ "none", .06 ] ],
    metro: [ [ "platform", .34 ], [ "concourse", .2 ], [ "maint", .16 ], [ "toilet", .08 ], [ "store", .14 ], [ "none", .08 ] ],
    base: [ [ "barracks", .3 ], [ "armory", .16 ], [ "mess", .12 ], [ "command", .14 ], [ "motor", .12 ], [ "store", .1 ], [ "none", .06 ] ]
  };
  function rollTheme(rng, bid) {
    const t = THEMES[bid] || THEMES.office;
    let r = rng.f();
    for (const [k, w] of t) {
      if ((r -= w) <= 0) return k;
    }
    return "none";
  }
  const THEME_FLOOR = {
    office: FS.CARPET,
    meeting: FS.CARPET,
    pantry: FS.LINO,
    store: FS.CONC,
    shop: FS.CHECK,
    ward: FS.HOSP,
    surgery: FS.TILE,
    kitchen: FS.LINO,
    bunk: FS.WOOD,
    none: FS.CONC,
    classroom: FS.WOOD,
    library: FS.CARPET,
    lab: FS.TILE,
    cafeteria: FS.LINO,
    platform: FS.LOBBY,
    concourse: FS.MARBLE,
    maint: FS.CONC,
    toilet: FS.TILE,
    barracks: FS.CONC,
    armory: FS.CONC,
    mess: FS.LINO,
    command: FS.CARPET,
    motor: FS.CONC,
    cubicles: FS.CARPET,
    atrium: FS.CHECK,
    reception: FS.MARBLE,
    gym: FS.WOOD,
    yard: FS.CONC
  };
  function paintRoomFloor(F, r) {
    const fs = THEME_FLOOR[r.theme] || FS.CONC;
    for (let y = r.y0; y <= r.y1; y++) for (let x = r.x0; x <= r.x1; x++) {
      const i = F.i(x, y);
      if (F.t[i] === T.FLOOR) F.fs[i] = fs;
    }
  }
  const TALL = {
    shelf: 1,
    locker: 1,
    vending: 1,
    fridge: 1,
    board: 0,
    copier: 0,
    cabinet: 0,
    partition: 1,
    tank: 0,
    pillar: 1,
    plate: 1
  };
  const COVER = {
    desk: .5,
    counter: .7,
    shelf: .6,
    cabinet: .6,
    locker: .7,
    fridge: .7,
    vending: .8,
    bed: .4,
    sofa: .5,
    boxes: .6,
    crate: .6,
    table: .5,
    car: .9,
    bus: .9,
    drum: .7,
    ac: .8,
    tank: .9,
    stall: .5,
    stash: .6,
    pillar: .97,
    plate: .9,
    sandbag: .9
  };
  const PASSABLE = {
    trash: 1,
    mattress: 1,
    loot: 1,
    corpse: 1,
    bag: 1,
    sign: 1,
    lamp: 0,
    board: 0,
    plate: 1,
    rangePlate: 1,
    silh: 1
  };
  function addProp(F, kind, x, y, o) {
    o = o || {};
    const sz = (SX.art.propSize(kind) ? SX.art.propDims(kind, o.rot | 0) : null) || (o.cont || o.npc ? {
      fw: 1,
      fh: 1
    } : null);
    if (!sz) return null;
    const p = {
      kind,
      x,
      y,
      w: sz.fw,
      h: sz.fh,
      v: o.v | 0,
      rot: o.rot | 0,
      floor: F.idx,
      solid: o.solid != null ? o.solid : !PASSABLE[kind],
      tall: o.tall != null ? o.tall : !!TALL[kind],
      cover: o.cover != null ? o.cover : COVER[kind] || .3
    };
    if (o.cont) p.cont = o.cont;
    if (o.npc) p.npc = o.npc;
    F.props.push(p);
    let auto = false;
    if (!o.hit && p.solid && (F.kind === "floor" || F.kind === "roof" || F.autoHit) && x % 1 === 0 && y % 1 === 0 && SX.art.hitTrusted && SX.art.hitTrusted(kind)) {
      const h = SX.art.propHit(kind, o.rot | 0);
      if (h && h.walk && h.walk.length) {
        o = Object.assign({}, o, {
          hit: h
        });
        auto = true;
      }
    }
    if (o.hit) {
      p.hit = SX.art.hitAt(o.hit, x, y);
      p.hit.foot = p.hit.walk;
      if (p.hit.walk && p.hit.walk.length && !p.hit.low) p.hit.walk = M.wallFill(F, p.hit.walk, x, y, p.w);
    }
    p.fine = !!p.hit || x % 1 !== 0 || y % 1 !== 0;
    if (auto) p.auto = true;
    if (p.solid) {
      propTiles(p, i => {
        F.solid[i] = 1;
        F.propAt[i] = p;
      }, F);
      if (p.fine && !p.auto) (F.fine || (F.fine = [])).push(p);
      if (p.auto) {
        const rs = p.hit.walk;
        if (rs.every(q => q.x1 - q.x0 <= .6 && q.y1 - q.y0 <= .6)) {
          if (!F.thin) F.thin = new Uint8Array(F.W * F.H);
          propTiles(p, i => {
            F.thin[i] = 1;
          }, F);
        }
      }
    }
    if (p.cont) {
      p.cont.prop = p;
      p.cont.floor = F.idx;
      p.cont.x = x + p.w / 2;
      p.cont.y = y + p.h / 2;
      F.conts.push(p.cont);
    }
    return p;
  }
  const solidRect = p => !p.auto && p.hit || {
    x0: p.x,
    y0: p.y,
    x1: p.x + p.w,
    y1: p.y + p.h
  };
  M.solidRect = solidRect;
  function propTiles(p, fn, F) {
    const r = solidRect(p), E = 1e-6, x0 = Math.floor(r.x0 + E), x1 = Math.ceil(r.x1 - E) - 1, y0 = Math.floor(r.y0 + E), y1 = Math.ceil(r.y1 - E) - 1;
    for (let yy = y0; yy <= y1; yy++) for (let xx = x0; xx <= x1; xx++) if (F.in(xx, yy)) fn(F.i(xx, yy), xx, yy);
  }
  M.addProp = addProp;
  M.addDoor = addDoor;
  M.removeProp = function(F, p) {
    const k = F.props.indexOf(p);
    if (k >= 0) F.props.splice(k, 1);
    if (p.solid) propTiles(p, (i, xx, yy) => {
      if (F.propAt[i] !== p) return;
      const q = F.props.find(o => {
        if (!o.solid) return false;
        const r = solidRect(o);
        return r.x0 < xx + 1 && r.x1 > xx && r.y0 < yy + 1 && r.y1 > yy;
      });
      if (F.thin) F.thin[i] = 0;
      if (q) {
        F.propAt[i] = q;
      } else {
        F.solid[i] = 0;
        F.propAt[i] = null;
      }
    }, F);
    if (F.fine) {
      const j = F.fine.indexOf(p);
      if (j >= 0) F.fine.splice(j, 1);
    }
    if (p.cont) {
      const j = F.conts.indexOf(p.cont);
      if (j >= 0) F.conts.splice(j, 1);
    }
  };
  function freeRect(F, x, y, w, h, pad) {
    for (let yy = y - (pad || 0); yy < y + h + (pad || 0); yy++) for (let xx = x - (pad || 0); xx < x + w + (pad || 0); xx++) {
      if (!F.in(xx, yy)) return false;
      const i = F.i(xx, yy), t = F.t[i];
      if (xx >= x && xx < x + w && yy >= y && yy < y + h) {
        if (t !== T.FLOOR && t !== T.GROUND) return false;
        if (F.solid[i]) return false;
      } else if (t === T.DOOR || t === T.STAIR) return false;
    }
    return true;
  }
  M.freeRect = freeRect;
  function nearDoor(F, x, y, w, h, r) {
    for (const d of F.doors) if (d.cx > x - r && d.cx < x + w + r && d.cy > y - r && d.cy < y + h + r) return true;
    return false;
  }
  function spot(F, r, rng, w, h, wall) {
    const cands = [];
    for (let y = r.y0; y <= r.y1 - h + 1; y++) for (let x = r.x0; x <= r.x1 - w + 1; x++) {
      const touchTop = y === r.y0 && F.tile(x, y - 1) === T.WALL;
      const touchSide = x === r.x0 && F.tile(x - 1, y) === T.WALL || x + w - 1 === r.x1 && F.tile(x + w, y) === T.WALL;
      const touchBot = y + h - 1 === r.y1 && F.tile(x, y + h) === T.WALL;
      if (wall && !(touchTop || touchSide || touchBot)) continue;
      if (!wall && (x === r.x0 || y === r.y0 || x + w - 1 === r.x1 || y + h - 1 === r.y1)) continue;
      cands.push({
        x,
        y,
        top: touchTop
      });
    }
    rng.shuffle(cands);
    if (wall) cands.sort((a, b) => (b.top ? 1 : 0) - (a.top ? 1 : 0));
    for (const c of cands) {
      if (!freeRect(F, c.x, c.y, w, h, 0)) continue;
      if (nearDoor(F, c.x, c.y, w, h, 2)) continue;
      return c;
    }
    return null;
  }
  const CONT_GRID = {
    armory: [ 6, 4 ],
    crate: [ 5, 4 ],
    cabinet: [ 4, 4 ],
    locker: [ 3, 5 ],
    fridge: [ 3, 4 ],
    shelf: [ 5, 3 ],
    medcab: [ 3, 3 ],
    desk: [ 3, 2 ],
    trash: [ 3, 2 ],
    bag: [ 4, 4 ],
    corpse: [ 6, 5 ],
    loose: [ 2, 2 ],
    vault: [ 5, 3 ]
  };
  function mkCont(type, items, rng) {
    const g = CONT_GRID[type] || [ 4, 4 ];
    const grid = SX.items.grid(g[0], g[1]);
    for (const it of items) SX.items.putGrow(grid, it);
    return {
      type,
      grid,
      searched: false,
      name: CONT_NAMES[type] || "상자"
    };
  }
  const CONT_NAMES = {
    armory: "군용 무기 상자",
    crate: "보급 상자",
    cabinet: "서랍장",
    locker: "사물함",
    fridge: "냉장고",
    shelf: "선반",
    medcab: "의약품장",
    desk: "책상 서랍",
    trash: "쓰레기 더미",
    bag: "떨어진 가방",
    corpse: "시신",
    loose: "바닥",
    vault: "금고"
  };
  M.mkCont = mkCont;
  function put(F, r, rng, kind, wall, contType, ctx, extra) {
    const sz = SX.art.propSize(kind);
    if (!sz) return null;
    const s = spot(F, r, rng, sz.fw, sz.fh, wall);
    if (!s) return null;
    const o = Object.assign({
      v: rng.i(12)
    }, extra || {});
    if (contType) o.cont = mkCont(contType, SX.items.rollContainer(rng, contType, ctx), rng);
    return addProp(F, kind, s.x, s.y, o);
  }
  function placeAt(F, kind, x, y, o) {
    const sz = SX.art.propSize(kind);
    if (!sz) return null;
    if (!freeRect(F, x, y, sz.fw, sz.fh, 0) || nearDoor(F, x, y, sz.fw, sz.fh, 2)) return null;
    return addProp(F, kind, x, y, o || {});
  }
  const contOf = (rng, type, ctx) => mkCont(type, SX.items.rollContainer(rng, type, ctx), rng);
  function scatterKind(F, r, rng, kind, n, o) {
    let done = 0;
    for (let t = 0; t < n * 12 && done < n; t++) {
      const x = r.x0 + 1 + rng.i(Math.max(1, r.x1 - r.x0 - 1)), y = r.y0 + 1 + rng.i(Math.max(1, r.y1 - r.y0 - 1));
      const opt = Object.assign({
        v: rng.i(12)
      }, o || {});
      if (opt.contType) {
        opt.cont = contOf(rng, opt.contType, o.ctx);
        delete opt.contType;
        delete opt.ctx;
      }
      if (placeAt(F, kind, x, y, opt)) done++;
    }
    return done;
  }
  function pillars(F, r, rng, step) {
    for (let y = r.y0 + 3; y < r.y1 - 1; y += step) for (let x = r.x0 + 3; x < r.x1 - 1; x += step) {
      if (!freeRect(F, x, y, 1, 1, 1) || nearDoor(F, x, y, 1, 1, 3)) continue;
      F.set(x, y, T.WALL);
    }
  }
  function furnishBig(F, r, rng, ctx) {
    const w = r.x1 - r.x0 + 1, h = r.y1 - r.y0 + 1;
    switch (r.big) {
     case "cubicles":
      for (let y = r.y0 + 2; y + 1 <= r.y1 - 1; y += 4) for (let x = r.x0 + 1; x + 1 <= r.x1 - 1; x += 3) {
        if (!rng.chance(.85)) continue;
        placeAt(F, "partition", x, y, {
          v: rng.i(4)
        });
        placeAt(F, "desk", x, y + 1, {
          v: rng.i(12),
          cont: rng.chance(.3) ? contOf(rng, "desk", ctx) : null
        });
        if (rng.chance(.4)) placeAt(F, "chair", x + 1, y + 1, {
          v: rng.i(4)
        });
      }
      scatterKind(F, r, rng, "copier", 1);
      scatterKind(F, r, rng, "plant", 2);
      scatterKind(F, r, rng, "cabinet", 2, {
        contType: "cabinet",
        ctx
      });
      break;

     case "atrium":
      pillars(F, r, rng, 6);
      scatterKind(F, r, rng, "counter", 4, {
        contType: "cabinet",
        ctx
      });
      scatterKind(F, r, rng, "shelf", 4, {
        contType: "shelf",
        ctx
      });
      scatterKind(F, r, rng, "bench", 4);
      scatterKind(F, r, rng, "plant", 4);
      scatterKind(F, r, rng, "vending", 2);
      scatterKind(F, r, rng, "atm", 1);
      scatterKind(F, r, rng, "boxes", 3);
      break;

     case "reception":
      pillars(F, r, rng, 8);
      scatterKind(F, r, rng, "counter", 3, {
        contType: "desk",
        ctx
      });
      scatterKind(F, r, rng, "bench", 6);
      scatterKind(F, r, rng, "plant", 4);
      scatterKind(F, r, rng, "ivStand", 2);
      scatterKind(F, r, rng, "vending", 1);
      break;

     case "platform":
      {
        pillars(F, r, rng, 6);
        const sz = SX.art.propSize("bus");
        if (sz) {
          const y = r.y0 + Math.floor(h / 2) - Math.floor(sz.fh / 2);
          for (let x = r.x0 + 2; x + sz.fw <= r.x1 - 1; x += sz.fw + 1) placeAt(F, "bus", x, y, {
            v: rng.i(3),
            cover: .9,
            solid: true
          });
        }
        scatterKind(F, r, rng, "bench", 4);
        scatterKind(F, r, rng, "vending", 2);
        scatterKind(F, r, rng, "boxes", 2);
        scatterKind(F, r, rng, "crate", 2, {
          contType: "crate",
          ctx
        });
        break;
      }

     case "concourse":
      pillars(F, r, rng, 6);
      scatterKind(F, r, rng, "counter", 3, {
        contType: "desk",
        ctx
      });
      scatterKind(F, r, rng, "vending", 3);
      scatterKind(F, r, rng, "atm", 2);
      scatterKind(F, r, rng, "bench", 4);
      scatterKind(F, r, rng, "plant", 3);
      scatterKind(F, r, rng, "boxes", 2);
      break;

     case "motor":
      if (SX.art.propSize("car")) scatterKind(F, r, rng, "car", 3, {
        cover: .9,
        solid: true
      });
      scatterKind(F, r, rng, "drum", 5);
      scatterKind(F, r, rng, "crate", 4, {
        contType: "crate",
        ctx
      });
      scatterKind(F, r, rng, "workbench", 2);
      scatterKind(F, r, rng, "boxes", 3);
      break;

     case "yard":
      for (let k = 0; k < 3; k++) {
        const x = r.x0 + 2 + rng.i(Math.max(1, w - 8)), y = r.y0 + 2 + rng.i(Math.max(1, h - 4));
        for (let m = 0; m < 3; m++) placeAt(F, "barrier", x + m * 2, y, {
          v: rng.i(3),
          cover: .85,
          solid: true
        });
      }
      scatterKind(F, r, rng, "drum", 5);
      scatterKind(F, r, rng, "crate", 5, {
        contType: "crate",
        ctx
      });
      scatterKind(F, r, rng, "boxes", 3);
      scatterKind(F, r, rng, "hydrant", 1);
      break;

     case "gym":
      scatterKind(F, r, rng, "bench", 6);
      scatterKind(F, r, rng, "mattress", 4);
      scatterKind(F, r, rng, "boxes", 4);
      scatterKind(F, r, rng, "crate", 2, {
        contType: "crate",
        ctx
      });
      if (SX.art.propSize("punchBag")) scatterKind(F, r, rng, "punchBag", 2);
      break;

     case "mess":
     case "cafeteria":
      for (let y = r.y0 + 2; y + 1 <= r.y1 - 2; y += 4) for (let x = r.x0 + 2; x + 2 <= r.x1 - 1; x += 5) {
        if (rng.chance(.8)) {
          placeAt(F, "table", x, y, {
            v: rng.i(4)
          });
          if (rng.chance(.6)) placeAt(F, "chair", x + 2, y, {
            v: rng.i(4)
          });
        }
      }
      scatterKind(F, r, rng, "counter", 2, {
        contType: "cabinet",
        ctx,
        v: 1
      });
      scatterKind(F, r, rng, "fridge", 2, {
        contType: "fridge",
        ctx
      });
      scatterKind(F, r, rng, "vending", 1);
      break;

     case "meeting":
      for (let x = r.x0 + 3; x + 2 <= r.x1 - 2; x += 3) {
        const y = r.y0 + Math.floor(h / 2) - 1;
        placeAt(F, "table", x, y, {
          v: rng.i(4)
        });
        if (rng.chance(.7)) placeAt(F, "chair", x, y - 1, {
          v: rng.i(4)
        });
        if (rng.chance(.7)) placeAt(F, "chair", x + 1, y + 1, {
          v: rng.i(4)
        });
      }
      scatterKind(F, r, rng, "plant", 2);
      break;

     default:
      scatterKind(F, r, rng, "boxes", 3);
      scatterKind(F, r, rng, "crate", 2, {
        contType: "crate",
        ctx
      });
    }
  }
  function furnishRoom(F, r, rng, ctx) {
    if (r.big) furnishBig(F, r, rng, ctx);
    const area = (r.x1 - r.x0 + 1) * (r.y1 - r.y0 + 1);
    const passes = r.theme === "none" ? 1 : Math.min(3, 1 + Math.floor(area / 60));
    for (let p = 0; p < passes; p++) {
      switch (r.theme) {
       case "office":
        put(F, r, rng, "desk", false, rng.chance(.5) ? "desk" : null, ctx);
        put(F, r, rng, "desk", false, null, ctx);
        put(F, r, rng, "chair", false);
        put(F, r, rng, "cabinet", true, rng.chance(.7) ? "cabinet" : null, ctx);
        put(F, r, rng, "shelf", true, rng.chance(.5) ? "shelf" : null, ctx);
        if (rng.chance(.5)) put(F, r, rng, "partition", false);
        if (rng.chance(.4)) put(F, r, rng, "copier", true);
        if (rng.chance(.5)) put(F, r, rng, "plant", true);
        if (rng.chance(.3)) put(F, r, rng, "board", true);
        break;

       case "meeting":
        put(F, r, rng, "table", false, null, ctx);
        put(F, r, rng, "chair", false);
        put(F, r, rng, "chair", false);
        put(F, r, rng, "board", true);
        if (rng.chance(.6)) put(F, r, rng, "plant", true);
        if (rng.chance(.5)) put(F, r, rng, "cabinet", true, "cabinet", ctx);
        break;

       case "pantry":
        put(F, r, rng, "counter", true, rng.chance(.4) ? "cabinet" : null, ctx, {
          v: 1
        });
        put(F, r, rng, "fridge", true, "fridge", ctx);
        if (rng.chance(.6)) put(F, r, rng, "vending", true);
        if (rng.chance(.5)) put(F, r, rng, "table", false);
        break;

       case "kitchen":
        put(F, r, rng, "counter", true, rng.chance(.5) ? "cabinet" : null, ctx, {
          v: 1
        });
        put(F, r, rng, "fridge", true, "fridge", ctx);
        if (rng.chance(.5)) put(F, r, rng, "sink", true);
        if (rng.chance(.4)) put(F, r, rng, "table", false);
        break;

       case "bunk":
        put(F, r, rng, "mattress", false);
        put(F, r, rng, "locker", true, "locker", ctx);
        if (rng.chance(.6)) put(F, r, rng, "cabinet", true, "cabinet", ctx);
        if (rng.chance(.5)) put(F, r, rng, "sofa", true);
        if (rng.chance(.4)) put(F, r, rng, "plant", true);
        break;

       case "shop":
        put(F, r, rng, "counter", true, null, ctx);
        put(F, r, rng, "shelf", true, "shelf", ctx);
        put(F, r, rng, "shelf", true, rng.chance(.6) ? "shelf" : null, ctx);
        put(F, r, rng, "boxes", false);
        if (rng.chance(.5)) put(F, r, rng, "vending", true);
        if (rng.chance(.5)) put(F, r, rng, "crate", false, "crate", ctx);
        break;

       case "store":
        put(F, r, rng, "boxes", false);
        put(F, r, rng, "crate", false, "crate", ctx);
        put(F, r, rng, "shelf", true, "shelf", ctx);
        if (rng.chance(.6)) put(F, r, rng, "drum", false);
        if (rng.chance(.4)) put(F, r, rng, "o2", true);
        if (rng.chance(.5)) put(F, r, rng, "boxes", false);
        break;

       case "ward":
        put(F, r, rng, "bed", true);
        put(F, r, rng, "bed", true);
        if (rng.chance(.6)) put(F, r, rng, "bed", true);
        put(F, r, rng, "ivStand", false);
        put(F, r, rng, "cabinet", true, "medcab", ctx, {
          v: 5
        });
        if (rng.chance(.4)) put(F, r, rng, "sink", true);
        break;

       case "surgery":
        put(F, r, rng, "opTable", false);
        put(F, r, rng, "counter", true, null, ctx);
        put(F, r, rng, "cabinet", true, "medcab", ctx);
        put(F, r, rng, "o2", true);
        put(F, r, rng, "ivStand", false);
        break;

       case "classroom":
        if (p === 0) put(F, r, rng, "board", true);
        put(F, r, rng, "desk", false, rng.chance(.3) ? "desk" : null, ctx);
        put(F, r, rng, "desk", false, null, ctx);
        put(F, r, rng, "desk", false, rng.chance(.2) ? "desk" : null, ctx);
        put(F, r, rng, "chair", false);
        put(F, r, rng, "chair", false);
        if (rng.chance(.5)) put(F, r, rng, "locker", true, rng.chance(.5) ? "locker" : null, ctx);
        if (rng.chance(.4)) put(F, r, rng, "cabinet", true, "cabinet", ctx);
        if (rng.chance(.3)) put(F, r, rng, "plant", true);
        break;

       case "library":
        put(F, r, rng, "bookshelf", true, rng.chance(.4) ? "shelf" : null, ctx);
        put(F, r, rng, "bookshelf", true, null, ctx);
        if (rng.chance(.6)) put(F, r, rng, "bookshelf", true, null, ctx);
        put(F, r, rng, "table", false);
        put(F, r, rng, "chair", false);
        if (rng.chance(.4)) put(F, r, rng, "desk", false, "desk", ctx);
        break;

       case "lab":
        put(F, r, rng, "counter", true, rng.chance(.4) ? "cabinet" : null, ctx, {
          v: 1
        });
        put(F, r, rng, "sink", true);
        put(F, r, rng, "cabinet", true, rng.chance(.6) ? "medcab" : "cabinet", ctx, {
          v: 5
        });
        put(F, r, rng, "table", false);
        if (rng.chance(.3)) put(F, r, rng, "o2", true);
        break;

       case "cafeteria":
        put(F, r, rng, "table", false);
        put(F, r, rng, "table", false);
        put(F, r, rng, "counter", true, null, ctx, {
          v: 1
        });
        put(F, r, rng, "fridge", true, "fridge", ctx);
        if (rng.chance(.5)) put(F, r, rng, "vending", true);
        break;

       case "platform":
        put(F, r, rng, "bench", true);
        put(F, r, rng, "bench", true);
        if (rng.chance(.5)) put(F, r, rng, "vending", true);
        if (rng.chance(.3)) put(F, r, rng, "atm", true);
        if (rng.chance(.4)) put(F, r, rng, "boxes", false);
        if (rng.chance(.3)) put(F, r, rng, "crate", false, "crate", ctx);
        break;

       case "concourse":
        put(F, r, rng, "counter", true, rng.chance(.5) ? "desk" : null, ctx);
        put(F, r, rng, "vending", true);
        if (rng.chance(.5)) put(F, r, rng, "atm", true);
        put(F, r, rng, "bench", true);
        if (rng.chance(.5)) put(F, r, rng, "plant", true);
        break;

       case "maint":
        put(F, r, rng, "desk", false, "desk", ctx);
        put(F, r, rng, "locker", true, "locker", ctx);
        put(F, r, rng, "cabinet", true, rng.chance(.6) ? "cabinet" : null, ctx);
        put(F, r, rng, "radio", true);
        if (rng.chance(.4)) put(F, r, rng, "drum", false);
        break;

       case "toilet":
        put(F, r, rng, "toilet", true);
        put(F, r, rng, "toilet", true);
        put(F, r, rng, "sink", true);
        break;

       case "barracks":
        put(F, r, rng, "cot", false);
        put(F, r, rng, "cot", false);
        if (rng.chance(.6)) put(F, r, rng, "cot", false);
        put(F, r, rng, "locker", true, "locker", ctx);
        if (rng.chance(.5)) put(F, r, rng, "locker", true, "locker", ctx);
        if (rng.chance(.4)) put(F, r, rng, "cabinet", true, "cabinet", ctx);
        break;

       case "armory":
        put(F, r, rng, "gunRack", true);
        put(F, r, rng, "crate", false, "armory", ctx);
        if (rng.chance(.6)) put(F, r, rng, "crate", false, "armory", ctx);
        put(F, r, rng, "shelf", true, "shelf", ctx);
        if (rng.chance(.5)) put(F, r, rng, "boxes", false);
        break;

       case "mess":
        put(F, r, rng, "table", false);
        put(F, r, rng, "table", false);
        put(F, r, rng, "counter", true, rng.chance(.4) ? "cabinet" : null, ctx, {
          v: 1
        });
        put(F, r, rng, "fridge", true, "fridge", ctx);
        if (rng.chance(.4)) put(F, r, rng, "sink", true);
        break;

       case "command":
        put(F, r, rng, "desk", false, "desk", ctx);
        put(F, r, rng, "radio", true);
        put(F, r, rng, "board", true);
        put(F, r, rng, "cabinet", true, "cabinet", ctx);
        if (rng.chance(.5)) put(F, r, rng, "chair", false);
        if (rng.chance(.3)) put(F, r, rng, "tv", true);
        break;

       case "motor":
        put(F, r, rng, "workbench", true);
        put(F, r, rng, "drum", false);
        if (rng.chance(.6)) put(F, r, rng, "drum", false);
        put(F, r, rng, "crate", false, "crate", ctx);
        put(F, r, rng, "boxes", false);
        break;

       default:
        if (rng.chance(.7)) put(F, r, rng, "boxes", false);
        if (rng.chance(.4)) put(F, r, rng, "crate", false, "crate", ctx);
      }
    }
    if (rng.chance(.6)) put(F, r, rng, "trash", false, rng.chance(.3) ? "trash" : null, ctx);
  }
  function furnishCorridors(F, rng, f) {
    let n = 0;
    for (let k = 0; k < 400 && n < 40; k++) {
      const x = M.MARGIN + 2 + rng.i(M.SIZE - 4), y = M.MARGIN + 2 + rng.i(M.SIZE - 4);
      if (F.room[F.i(x, y)] !== -1 || F.tile(x, y) !== T.FLOOR) continue;
      if (F.tile(x, y - 1) !== T.WALL) continue;
      const kind = rng.pick(f === 0 ? [ "sofa", "plant", "vending", "atm", "bench", "plant" ] : [ "bench", "plant", "vending", "trash", "boxes" ]);
      const sz = SX.art.propSize(kind);
      if (!sz) continue;
      if (!freeRect(F, x, y, sz.fw, sz.fh, 0) || nearDoor(F, x, y, sz.fw, sz.fh, 2)) continue;
      if (F.tile(x, y + sz.fh) !== T.FLOOR || F.tile(x, y + sz.fh + 1) !== T.FLOOR) continue;
      addProp(F, kind, x, y, {
        v: rng.i(6)
      });
      n++;
    }
  }
  function tacStructures(F, rng, want, o) {
    o = o || {};
    const isFree = (x, y) => F.in(x, y) && (F.t[F.i(x, y)] === T.FLOOR || F.t[F.i(x, y)] === T.GROUND) && !F.solid[F.i(x, y)];
    const passSide = (x, y, w) => {
      for (const s of [ 1, -1 ]) {
        let ok = true;
        for (let xx = x - 1; ok && xx <= x + w; xx++) for (const k of [ 1, 2 ]) if (!isFree(xx, y + s * k)) ok = false;
        if (ok) return s;
      }
      return 0;
    };
    const x0 = o.x0 == null ? M.MARGIN + 2 : o.x0, y0 = o.y0 == null ? M.MARGIN + 2 : o.y0, x1 = o.x1 == null ? M.MARGIN + M.SIZE - 4 : o.x1, y1 = o.y1 == null ? M.MARGIN + M.SIZE - 3 : o.y1;
    let n = 0;
    for (let t = 0; t < 1200 && n < want; t++) {
      const x = x0 + rng.i(Math.max(1, x1 - x0 + 1)), y = y0 + rng.i(Math.max(1, y1 - y0 + 1));
      if (!F.in(x, y)) continue;
      const i = F.i(x, y), tt = F.t[i];
      if (tt !== T.FLOOR && tt !== T.GROUND) continue;
      const rid = F.room[i], r = rid >= 0 ? F.rooms[rid] : null;
      if (r && !r.big && !o.anyRoom) continue;
      const kind = rng.pick(o.kinds || (r ? [ "sandbag", "sandbag", "plate", "pillar" ] : [ "plate", "sandbag", "pillar", "plate", "sandbag" ]));
      const sz = SX.art.propSize(kind);
      if (!sz) continue;
      if (!freeRect(F, x, y, sz.fw, sz.fh, 1) || nearDoor(F, x, y, sz.fw, sz.fh, 3)) continue;
      if ((o.zones || []).some(z => x + sz.fw > z.x - 2 && x < z.x + z.w + 2 && y + 1 > z.y - 2 && y < z.y + z.h + 2)) continue;
      if (F.stairs.some(s => x + sz.fw > s.x - 3 && x < s.x + s.w + 3 && y + 1 > s.y - 3 && y < s.y + s.h + 3)) continue;
      const s = passSide(x, y, sz.fw);
      if (!s) continue;
      let far = false;
      for (let xx = x; xx < x + sz.fw; xx++) if (isFree(xx, y - s)) far = true;
      if (far && !(isFree(x - 1, y) && isFree(x - 1, y - s) || isFree(x + sz.fw, y) && isFree(x + sz.fw, y - s))) continue;
      if (F.props.some(p => p.tac && Math.abs(p.x - x) < 6 && Math.abs(p.y - y) < 5)) continue;
      const p = addProp(F, kind, x, y, {
        v: rng.i(6),
        solid: true
      });
      if (p) {
        p.tac = true;
        n++;
      }
    }
    return n;
  }
  M.tacStructures = tacStructures;
  function scatterLoot(F, rng, ctx, n, f) {
    let placed = 0;
    for (let k = 0; k < 400 && placed < n; k++) {
      const r = rng.pick(F.rooms);
      if (!r) break;
      const x = r.x0 + rng.i(r.x1 - r.x0 + 1), y = r.y0 + rng.i(r.y1 - r.y0 + 1);
      if (!freeRect(F, x, y, 1, 1, 0)) continue;
      const it = rng.f() < (ctx.building.special || .17) ? SX.items.rollSpecial(rng) : SX.items.rollItem(rng, ctx);
      addProp(F, "loot", x, y, {
        cont: mkCont("loose", [ it ], rng)
      });
      placed++;
    }
    const guns = f === 0 ? 0 : rng.chance(.3) ? 1 : 0;
    for (let g = 0; g < guns + (rng.chance(.4) ? 1 : 0); g++) {
      const r = rng.pick(F.rooms);
      if (!r) break;
      const x = r.x0 + rng.i(r.x1 - r.x0 + 1), y = r.y0 + rng.i(r.y1 - r.y0 + 1);
      if (!freeRect(F, x, y, 1, 1, 0)) continue;
      const it = g < guns ? SX.items.mk(rng.pick(SX.LOOT_GUNS), {}) : SX.items.mk(rng.pick(SX.data.melee).name);
      if (it.kind === "gun") it.ammo = rng.i(it.magSize + 1);
      addProp(F, "loot", x, y, {
        cont: mkCont("loose", [ it ], rng)
      });
    }
    if (rng.chance(.35)) {
      const r = rng.pick(F.rooms);
      if (r) {
        const x = r.x0 + rng.i(r.x1 - r.x0 + 1), y = r.y0 + rng.i(r.y1 - r.y0 + 1);
        if (freeRect(F, x, y, 1, 1, 0)) {
          const bag = SX.items.mk(rng.pick(SX.data.containers.filter(c => c.val <= 45e3)).name);
          addProp(F, "bag", x, y, {
            v: rng.i(3),
            cont: mkCont("bag", [ bag ], rng)
          });
        }
      }
    }
  }
  function computeWindowLight(F) {
    const W = F.W, H = F.H;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (F.t[F.i(x, y)] !== T.WINDOW) continue;
      for (let dy = -6; dy <= 6; dy++) for (let dx = -6; dx <= 6; dx++) {
        const xx = x + dx, yy = y + dy;
        if (!F.in(xx, yy)) continue;
        const i = F.i(xx, yy);
        if (!F.inside[i]) continue;
        const v = Math.max(0, 1 - Math.hypot(dx, dy) / 6.5);
        if (v > F.win[i]) F.win[i] = v;
      }
    }
  }
  M.doorFront = (d, x, y) => !!d && (d.horiz !== false ? y === d.y - 1 && x >= d.x && x < d.x + (d.len || 2) : x === d.x - 1 && y >= d.y && y < d.y + (d.len || 2));
  M.doorSpan = (F, d) => {
    if (!d || !d.home || d.horiz === false || (d.len || 2) !== 2 || !F || !(d.hleaf || F.homeLeaf) || !SX.doorPlace || !SX.doorPlace.singleSpan) return null;
    const s = SX.doorPlace.singleSpan(d.hleaf || F.homeLeaf);
    return {
      x0: d.x + s[0],
      x1: d.x + s[1],
      y0: d.y - 1,
      y1: d.y
    };
  };
  M.doorFrontHit = (F, d, cells, rs, x, y) => {
    const s = M.doorSpan(F, d), E = 1e-6;
    if (!s) return cells.some(([a, b]) => M.doorFront(d, a, b));
    return rs.some(r => x + r.x0 < s.x1 - E && s.x0 < x + r.x1 - E && y + r.y0 < s.y1 - E && s.y0 < y + r.y1 - E);
  };
  M.HOME_PLANS = {
    0: () => ({
      w: 3,
      h: 8,
      rects: [ {
        x0: 0,
        y0: 3,
        x1: 2,
        y1: 7,
        name: "고시원"
      }, {
        x0: 0,
        y0: 0,
        x1: 1,
        y1: 1,
        name: "샤워 칸",
        fs: FS.TILE,
        surf: {
          w: "tileWall"
        }
      } ],
      doors: [ {
        x: 0,
        y: 2,
        horiz: true,
        len: 1
      } ],
      stairs: [],
      entry: {
        x: 1,
        y: 8
      },
      spawn: {
        x: 2,
        y: 7.8
      }
    }),
    1: () => ({
      w: 10,
      h: 5,
      rects: [ {
        x0: 0,
        y0: 0,
        x1: 6,
        y1: 4,
        name: "원룸"
      }, {
        x0: 8,
        y0: 0,
        x1: 9,
        y1: 1,
        name: "화장실",
        fs: FS.TILE,
        surf: {
          w: "tileWall"
        }
      } ],
      doors: [ {
        x: 7,
        y: 1,
        horiz: false,
        len: 1
      } ],
      stairs: [],
      entry: {
        x: 3,
        y: 5
      },
      spawn: {
        x: 4,
        y: 4.8
      },
      winTop: true,
      winBars: true
    }),
    2: () => ({
      w: 14,
      h: 6,
      rects: [ {
        x0: 0,
        y0: 0,
        x1: 8,
        y1: 5,
        name: "옥탑방"
      }, {
        x0: 10,
        y0: 1,
        x1: 13,
        y1: 5,
        name: "옥상 마당",
        fs: FS.ROOF,
        noWin: true,
        surf: {
          f: "concP"
        },
        sky: true
      } ],
      doors: [ {
        x: 9,
        y: 2,
        horiz: false,
        len: 2
      } ],
      parapets: [ {
        x0: 10,
        y0: 0,
        x1: 14,
        y1: 0
      }, {
        x0: 14,
        y0: 1,
        x1: 14,
        y1: 6
      }, {
        x0: 10,
        y0: 6,
        x1: 13,
        y1: 6
      } ],
      fixtures: [ {
        kind: "jangdok",
        x: 11,
        y: 1
      } ],
      stairs: [],
      entry: {
        x: 4,
        y: 6
      },
      spawn: {
        x: 5,
        y: 5.8
      }
    }),
    3: () => ({
      w: 9,
      h: 10,
      rects: [ {
        x0: 0,
        y0: 4,
        x1: 8,
        y1: 9,
        name: "원룸"
      }, {
        x0: 0,
        y0: 0,
        x1: 8,
        y1: 2,
        name: "복층",
        fs: FS.WOOD,
        up: true
      } ],
      doors: [],
      stairs: [ {
        x0: 8,
        y0: 4,
        x1: 8,
        y1: 6,
        dir: "up",
        pair: 1
      }, {
        x0: 8,
        y0: 0,
        x1: 8,
        y1: 2,
        dir: "down",
        pair: 0
      } ],
      entry: {
        x: 4,
        y: 10
      },
      spawn: {
        x: 5,
        y: 9.8
      }
    }),
    4: () => ({
      w: 13,
      h: 12,
      rects: [ {
        x0: 0,
        y0: 5,
        x1: 9,
        y1: 11,
        name: "거실"
      }, {
        x0: 0,
        y0: 0,
        x1: 3,
        y1: 3,
        name: "침실"
      }, {
        x0: 6,
        y0: 1,
        x1: 9,
        y1: 3,
        name: "작은 방"
      }, {
        x0: 11,
        y0: 5,
        x1: 12,
        y1: 11,
        name: "베란다",
        fs: FS.TILE,
        noWin: true
      } ],
      doors: [ {
        x: 1,
        y: 4,
        horiz: true,
        len: 1
      }, {
        x: 7,
        y: 4,
        horiz: true,
        len: 1
      }, {
        x: 10,
        y: 7,
        horiz: false,
        len: 2
      } ],
      glass: [ {
        x0: 11,
        y0: 4,
        x1: 12,
        y1: 4
      }, {
        x0: 13,
        y0: 5,
        x1: 13,
        y1: 11
      }, {
        x0: 11,
        y0: 12,
        x1: 12,
        y1: 12
      } ],
      fixtures: [ {
        kind: "dryRack",
        x: 11,
        y: 11
      } ],
      stairs: [],
      entry: {
        x: 4,
        y: 12
      },
      spawn: {
        x: 5,
        y: 11.8
      }
    }),
    5: () => {
      const xs = [ [ 0, 5 ], [ 7, 12 ], [ 14, 19 ], [ 21, 27 ] ], top = [ "안방", "서재", "손님방", "작업실" ], bot = [ "주방", "다용도실", "작은 방", "창고" ];
      const rects = [ {
        x0: 0,
        y0: 6,
        x1: 27,
        y1: 8,
        name: "복도",
        fs: FS.LOBBY
      } ], doors = [];
      xs.forEach(([a, b], k) => {
        rects.push({
          x0: a,
          y0: 0,
          x1: b,
          y1: 4,
          name: top[k]
        });
        doors.push({
          x: Math.floor((a + b) / 2),
          y: 5,
          horiz: true,
          len: 1
        });
        rects.push({
          x0: a,
          y0: 10,
          x1: b,
          y1: 14,
          name: bot[k]
        });
        doors.push({
          x: Math.floor((a + b) / 2),
          y: 9,
          horiz: true,
          len: 1
        });
      });
      return {
        w: 28,
        h: 15,
        rects,
        doors,
        stairs: [],
        entry: {
          x: 28,
          y: 7,
          side: "r"
        },
        spawn: {
          x: 27.7,
          y: 8
        }
      };
    },
    6: () => ({
      w: 50,
      h: 23,
      rects: [ {
        x0: 17,
        y0: 14,
        x1: 32,
        y1: 22,
        name: "거실",
        noWinS: "l"
      }, {
        x0: 11,
        y0: 13,
        x1: 15,
        y1: 19,
        name: "안방",
        noWinS: "b"
      }, {
        x0: 18,
        y0: 10,
        x1: 23,
        y1: 12,
        name: "서재"
      }, {
        x0: 26,
        y0: 10,
        x1: 31,
        y1: 12,
        name: "손님방"
      }, {
        x0: 34,
        y0: 14,
        x1: 38,
        y1: 18,
        name: "드레스룸"
      }, {
        x0: 34,
        y0: 20,
        x1: 38,
        y1: 22,
        name: "욕실",
        fs: FS.TILE
      }, {
        x0: 11,
        y0: 5,
        x1: 38,
        y1: 8,
        name: "테라스",
        fs: FS.WOOD,
        noWin: true,
        out: true,
        sky: true
      }, {
        x0: 34,
        y0: 10,
        x1: 38,
        y1: 12,
        name: "비밀방",
        fs: FS.CARPET,
        noWin: true,
        secret: true
      }, {
        x0: 11,
        y0: 9,
        x1: 16,
        y1: 11,
        name: "테라스 화단",
        fs: FS.WOOD,
        noWin: true,
        out: true,
        zone: 6,
        sky: true
      } ],
      doors: [ {
        x: 16,
        y: 17,
        horiz: false,
        len: 1
      }, {
        x: 20,
        y: 13,
        horiz: true,
        len: 1
      }, {
        x: 28,
        y: 13,
        horiz: true,
        len: 1
      }, {
        x: 33,
        y: 16,
        horiz: false,
        len: 1
      }, {
        x: 33,
        y: 22,
        horiz: false,
        len: 1
      }, {
        x: 20,
        y: 9,
        horiz: true,
        len: 2
      }, {
        x: 28,
        y: 9,
        horiz: true,
        len: 2
      }, {
        x: 35,
        y: 13,
        horiz: true,
        len: 2,
        secret: true
      } ],
      parapets: [ {
        x0: 10,
        y0: 4,
        x1: 39,
        y1: 4,
        sty: "glass",
        fs: FS.WOOD
      }, {
        x0: 10,
        y0: 5,
        x1: 10,
        y1: 11,
        sty: "glass",
        fs: FS.WOOD
      }, {
        x0: 39,
        y0: 5,
        x1: 39,
        y1: 8,
        sty: "glass",
        fs: FS.WOOD
      } ],
      fixtures: [],
      river: {
        y1: 3,
        out: true
      },
      stairs: [],
      entry: {
        x: 24,
        y: 23
      },
      spawn: {
        x: 25,
        y: 22.8
      }
    }),
    7: () => ({
      w: 12,
      h: 9,
      rects: [ {
        x0: 0,
        y0: 3,
        x1: 7,
        y1: 8,
        name: "대피실",
        surf: {
          f: "concP",
          w: "concX"
        }
      }, {
        x0: 9,
        y0: 3,
        x1: 11,
        y1: 8,
        name: "기계실",
        fs: FS.CONC,
        surf: {
          f: "steel",
          w: "concX"
        }
      }, {
        x0: 0,
        y0: 0,
        x1: 4,
        y1: 1,
        name: "비상 창고",
        fs: FS.CONC,
        surf: {
          f: "concB",
          w: "concX"
        }
      } ],
      doors: [ {
        x: 8,
        y: 6,
        horiz: false,
        len: 1
      }, {
        x: 2,
        y: 2,
        horiz: true,
        len: 1
      } ],
      stairs: [],
      entry: {
        x: 3,
        y: 9
      },
      spawn: {
        x: 4,
        y: 8.8
      },
      doorSty: "olive"
    }),
    8: () => ({
      w: 18,
      h: 12,
      rects: [ {
        x0: 0,
        y0: 5,
        x1: 17,
        y1: 11,
        name: "옥상 마당",
        fs: FS.ROOF,
        noWin: true,
        surf: {
          f: "concP",
          w: "tin"
        },
        sky: true
      }, {
        x0: 0,
        y0: 0,
        x1: 6,
        y1: 3,
        name: "컨테이너 침실",
        fs: FS.WOOD,
        surf: {
          w: "tin"
        }
      }, {
        x0: 8,
        y0: 1,
        x1: 9,
        y1: 3,
        name: "샤워 칸",
        fs: FS.TILE,
        surf: {
          w: "tileWall"
        }
      }, {
        x0: 11,
        y0: 0,
        x1: 17,
        y1: 3,
        name: "컨테이너 작업실",
        fs: FS.CONC,
        surf: {
          f: "steel",
          w: "tin"
        }
      } ],
      doors: [ {
        x: 2,
        y: 4,
        horiz: true,
        len: 2
      }, {
        x: 8,
        y: 4,
        horiz: true,
        len: 2
      }, {
        x: 13,
        y: 4,
        horiz: true,
        len: 2
      } ],
      parapets: [ {
        x0: -1,
        y0: 5,
        x1: -1,
        y1: 12
      }, {
        x0: 18,
        y0: 5,
        x1: 18,
        y1: 12
      }, {
        x0: 0,
        y0: 12,
        x1: 5,
        y1: 12
      }, {
        x0: 12,
        y0: 12,
        x1: 17,
        y1: 12
      } ],
      stairs: [],
      entry: {
        x: 8,
        y: 12
      },
      spawn: {
        x: 9,
        y: 11.8
      },
      doorSty: "rust"
    }),
    9: () => ({
      w: 28,
      h: 14,
      rects: [ {
        x0: 6,
        y0: 8,
        x1: 21,
        y1: 13,
        name: "대합실",
        surf: {
          w: "tileWall"
        }
      }, {
        x0: 0,
        y0: 4,
        x1: 27,
        y1: 6,
        name: "승강장",
        fs: FS.LOBBY,
        surf: {
          w: "tileWall"
        }
      }, {
        x0: 0,
        y0: 8,
        x1: 4,
        y1: 13,
        name: "역무실",
        fs: FS.LINO,
        surf: {
          w: "pMint"
        }
      }, {
        x0: 23,
        y0: 8,
        x1: 27,
        y1: 10,
        name: "숙직실",
        fs: FS.LINO,
        surf: {
          f: "linoY",
          w: "wpFlower"
        }
      }, {
        x0: 23,
        y0: 12,
        x1: 27,
        y1: 13,
        name: "화장실",
        fs: FS.TILE,
        surf: {
          w: "tileWall"
        }
      } ],
      doors: [ {
        x: 9,
        y: 7,
        horiz: true,
        len: 2,
        stair: "down"
      }, {
        x: 17,
        y: 7,
        horiz: true,
        len: 2,
        stair: "esc"
      }, {
        x: 5,
        y: 11,
        horiz: false,
        len: 1
      }, {
        x: 22,
        y: 9,
        horiz: false,
        len: 1
      }, {
        x: 22,
        y: 13,
        horiz: false,
        len: 1
      } ],
      strips: [ {
        x0: 0,
        y0: 0,
        x1: 27,
        y1: 2,
        fs: FS.RAILH,
        seal: true,
        glow: [ 255, 70, 50 ],
        wall: "#5a5c58"
      } ],
      parapets: [ {
        x0: 0,
        y0: 3,
        x1: 27,
        y1: 3,
        sty: "psd"
      } ],
      glass: [ {
        x0: 5,
        y0: 9,
        x1: 5,
        y1: 10
      } ],
      stairs: [],
      entry: {
        x: 13,
        y: 14
      },
      spawn: {
        x: 14,
        y: 13.8
      },
      doorSty: "stain"
    })
  };
  M.homePlan = t => (M.HOME_PLANS[t.id] || M.HOME_PLANS[0])();
  M.wallFill = function(F, walk, x, y, w) {
    if (!walk.length) return walk;
    const wy = Math.floor(y - .3), ax = Math.min(...walk.map(q => q.x0)), bx = Math.max(...walk.map(q => q.x1));
    let wall = false;
    for (let xx = Math.floor(ax + 1e-6); xx <= Math.ceil(bx - 1e-6) - 1; xx++) {
      const t = F.tile(xx, wy);
      if (t === T.WALL || t === T.WINDOW || t === T.VOID) {
        wall = true;
        break;
      }
    }
    if (!wall) return walk;
    const top = Math.min(...walk.map(q => q.y0)), isW = t => t === T.WALL || t === T.WINDOW || t === T.VOID;
    let wl = wy + 1;
    for (let r = Math.floor(top - 1e-6); r > wy; r--) {
      let hit = false;
      for (let xx = Math.floor(ax + 1e-6); xx <= Math.ceil(bx - 1e-6) - 1; xx++) if (isW(F.tile(xx, r))) {
        hit = true;
        break;
      }
      if (hit) {
        wl = r + 1;
        break;
      }
    }
    const y0 = Math.max(y, wl);
    if (top - y0 < .02) return walk;
    return walk.concat([ {
      x0: Math.min(...walk.map(q => q.x0)),
      x1: Math.max(...walk.map(q => q.x1)),
      y0,
      y1: top + .01
    } ]);
  };
  M.HOME_MG = 3;
  M.homeFits = function(t, kind, x, y, rot) {
    const P = M.homePlan(t), sz = SX.art.propDims(kind, rot | 0);
    if (!sz || x == null || y == null) return false;
    const o = M.HOME_MG + 1;
    const cells = SX.home && SX.home.solidCells ? SX.home.solidCells(kind, x, y, rot | 0) : [];
    for (const [xx, yy] of cells) {
      const lx = xx - o, ly = yy - o;
      if (!P.rects.some(r => lx >= r.x0 && lx <= r.x1 && ly >= r.y0 && ly <= r.y1)) return false;
      if ((P.stairs || []).some(s => lx >= s.x0 && lx <= s.x1 && ly >= s.y0 && ly <= s.y1)) return false;
    }
    return cells.length > 0;
  };
  M.buildHome = function(t, home) {
    const P = M.homePlan(t);
    const mg = M.HOME_MG, W = P.w + mg * 2 + 2, H = P.h + mg * 2 + 4;
    const F = new Floor(W, H, 0, "hub");
    fillRect(F, 0, 0, W - 1, H - 1, T.VOID, FS.VOID, -1);
    F.homeLeaf = [ "wood", "old", "old", "apt", "apt", "steel", "lux", "olive", "rust", "shut" ][t.id] || "apt";
    F.homeDoor = P.doorSty || null;
    const ox = mg + 1, oy = mg + 1, x0 = ox, y0 = oy, x1 = ox + P.w - 1, y1 = oy + P.h - 1;
    if (P.river && !P.river.out) {
      const ry = oy + P.river.y1, bk = P.river.bank | 0;
      for (let y = 0; y <= ry; y++) for (let x = 0; x < W; x++) F.fs[F.i(x, y)] = FS.WATER;
      for (let y = 0; y < bk; y++) for (let x = 0; x < W; x++) F.set(x, y, T.GROUND, y === bk - 1 ? FS.WALK : FS.GRASS);
    }
    const parts = SX.home.partsOf(t.id), hv = Object.assign({}, home, {
      tier: t.id
    });
    const R = P.rects.map(r => ({
      x0: ox + r.x0,
      y0: oy + r.y0,
      x1: ox + r.x1,
      y1: oy + r.y1,
      name: r.name,
      fs: r.fs,
      loft: !!r.loft,
      noWin: !!r.noWin,
      noWinS: r.noWinS || "",
      secret: !!r.secret,
      up: !!r.up,
      sky: !!r.sky
    }));
    R.forEach((r, k) => {
      fillRect(F, r.x0, r.y0, r.x1, r.y1, T.FLOOR, SX.home.partFloor(parts[k], hv), k);
      for (let y = r.y0; y <= r.y1; y++) for (let x = r.x0; x <= r.x1; x++) F.inside[F.i(x, y)] = 1;
      F.rooms.push({
        id: k,
        theme: "home",
        x0: r.x0,
        y0: r.y0,
        x1: r.x1,
        y1: r.y1,
        name: r.name,
        loft: r.loft,
        sky: r.sky
      });
    });
    const wallAt = (x, y) => {
      const tt = F.tile(x, y);
      if (tt === T.VOID) F.set(x, y, T.WALL, 0);
    };
    for (const r of R) {
      for (let x = r.x0 - 1; x <= r.x1 + 1; x++) {
        wallAt(x, r.y0 - 1);
        wallAt(x, r.y1 + 1);
      }
      for (let y = r.y0 - 1; y <= r.y1 + 1; y++) {
        wallAt(r.x0 - 1, y);
        wallAt(r.x1 + 1, y);
      }
    }
    for (const q of P.solid || []) for (let y = oy + q.y0; y <= oy + q.y1; y++) for (let x = ox + q.x0; x <= ox + q.x1; x++) wallAt(x, y);
    for (const s of P.strips || []) {
      const a = ox + s.x0, b = oy + s.y0, c = ox + s.x1, d = oy + s.y1, e = s.ends === false ? 0 : 1;
      fillRect(F, a, b, c, d, T.GROUND, s.fs != null ? s.fs : FS.CONC, -1);
      for (let y = b; y <= d; y++) for (let x = a; x <= c; x++) F.inside[F.i(x, y)] = 1;
      for (let x = a - e; x <= c + e; x++) {
        wallAt(x, b - 1);
        wallAt(x, d + 1);
      }
      if (e) for (let y = b - 1; y <= d + 1; y++) {
        wallAt(a - 1, y);
        wallAt(c + 1, y);
      }
    }
    for (const q of P.parapets || []) for (let y = oy + q.y0; y <= oy + q.y1; y++) for (let x = ox + q.x0; x <= ox + q.x1; x++) if (F.tile(x, y) === T.WALL) {
      F.set(x, y, T.PARAPET);
      if (q.fs != null) F.fs[F.i(x, y)] = q.fs;
      if (q.sty) {
        if (!F.parSty) F.parSty = new Uint8Array(W * H);
        F.parSty[F.i(x, y)] = q.sty === "glass" ? 1 : q.sty === "psd" ? 3 : 2;
      }
    }
    for (const q of P.glass || []) for (let y = oy + q.y0; y <= oy + q.y1; y++) for (let x = ox + q.x0; x <= ox + q.x1; x++) if (F.tile(x, y) === T.WALL) F.set(x, y, T.WINDOW);
    for (const s of P.strips || []) if (s.seal) for (const v of [ 0, 1 ]) addProp(F, "railSeal", v ? ox + s.x1 - 1 : ox + s.x0 - 1, oy + s.y0, {
      v,
      solid: false
    });
    const wallCols = new Array(W * H).fill(null);
    let secDoor = null;
    P.doors.forEach((d, k) => {
      const dd = addDoor(F, ox + d.x, oy + d.y, d.horiz !== false, d.len || 2, {});
      if (!dd) return;
      dd.open = true;
      if (d.stair) dd.stair = d.stair;
      if (d.secret) {
        dd.open = false;
        dd.secret = true;
        secDoor = dd;
      }
      const pt = parts[P.rects.length + k], fsD = SX.home.partFloor(pt, hv), wc = SX.home.partWall(pt, hv);
      for (const i of dd.tiles) {
        F.fs[i] = fsD;
        wallCols[i] = wc;
      }
    });
    for (const s of P.strips || []) if (s.wall) for (let y = oy + s.y0 - 1; y <= oy + s.y1 + 1; y++) for (let x = ox + s.x0 - 1; x <= ox + s.x1 + 1; x++) {
      const tt = F.tile(x, y);
      if (tt === T.WALL && y < oy + s.y1 + 1) wallCols[F.i(x, y)] = s.wall;
    }
    for (const s of P.stairs) fillRect(F, ox + s.x0, oy + s.y0, ox + s.x1, oy + s.y1, T.STAIR, FS.STAIR, -1);
    const keep = new Set;
    P.stairs.forEach(s => {
      if (!s.dir) return;
      const st = {
        x: ox + s.x0,
        y: oy + s.y0,
        w: s.x1 - s.x0 + 1,
        h: s.y1 - s.y0 + 1,
        dir: s.dir,
        home: true,
        pair: s.pair
      };
      F.stairs.push(st);
      if (s.dir === "up") for (let x = st.x; x < st.x + st.w; x++) keep.add(F.i(x, st.y + st.h)); else keep.add(F.i(st.x - 1, st.y));
      (F.fine || (F.fine = [])).push({
        rail: true,
        hit: {
          walk: [ {
            x0: st.x - .08,
            x1: st.x + .08,
            y0: s.dir === "up" ? st.y : st.y + 1,
            y1: st.y + st.h - .05
          } ]
        }
      });
    });
    const doorKeep = [];
    for (const d of P.doors) if ((d.len || 2) === 1 && !d.secret && !d.stair) {
      const x = ox + d.x, y = oy + d.y, hz = d.horiz !== false;
      for (const s of [ -1, 1 ]) {
        const xx = hz ? x : x + s, yy = hz ? y + s : y;
        if (F.in(xx, yy) && F.tile(xx, yy) === T.FLOOR) {
          if (!keep.has(F.i(xx, yy))) doorKeep.push(F.i(xx, yy));
          keep.add(F.i(xx, yy));
        }
      }
    }
    F.keepAt = (x, y) => keep.has(F.i(x, y));
    const dks = new Set(doorKeep);
    F.doorKeepAt = (x, y) => dks.has(F.i(x, y));
    const ex = ox + P.entry.x, ey = oy + P.entry.y, sideR = P.entry.side === "r";
    const door = addDoor(F, ex, ey, !sideR, 2, {
      home: true
    });
    door.open = false;
    const land = F.homeLand = sideR ? [ ex + 1, ey, Math.min(W - 1, ex + 2), ey + 1 ] : [ ex, ey + 1, ex + 1, Math.min(H - 1, ey + 2) ];
    fillRect(F, land[0], land[1], land[2], land[3], T.GROUND, FS.CONC, -1);
    if (t.windows) {
      const nearOpen = (x, y) => [ [ 1, 0 ], [ -1, 0 ], [ 0, 1 ], [ 0, -1 ] ].some(([dx, dy]) => {
        const tt = F.tile(x + dx, y + dy);
        return tt === T.DOOR || tt === T.STAIR;
      });
      const edge = (cells, bx, by) => {
        let n = 0;
        for (const [x, y] of cells) {
          if (F.tile(x, y) !== T.WALL || F.tile(x + bx, y + by) !== T.VOID || nearOpen(x, y)) continue;
          if (++n % t.windows === 1 || t.windows === 1) F.set(x, y, T.WINDOW);
        }
      };
      for (const r of R) {
        if (r.noWin) continue;
        const top = [], bot = [], lef = [], rig = [];
        for (let x = r.x0 + 1; x < r.x1; x++) {
          top.push([ x, r.y0 - 1 ]);
          bot.push([ x, r.y1 + 1 ]);
        }
        for (let y = r.y0 + 1; y < r.y1; y++) {
          lef.push([ r.x0 - 1, y ]);
          rig.push([ r.x1 + 1, y ]);
        }
        if (P.winTop) {
          edge(top, 0, -1);
          continue;
        }
        edge(top, 0, -1);
        if (r.y1 - r.y0 >= 4 && !r.noWinS.includes("b")) edge(bot, 0, 1);
        if (r.y1 - r.y0 >= 3) {
          if (!r.noWinS.includes("l")) edge(lef, -1, 0);
          edge(rig, 1, 0);
        }
      }
    }
    if (R.some(r => r.up)) {
      const sm = new Uint8Array(W * H);
      R.forEach(r => {
        for (let y = r.y0 - 1; y <= r.y1 + 1; y++) for (let x = r.x0 - 1; x <= r.x1 + 1; x++) if (F.in(x, y)) {
          const i = F.i(x, y), v = r.up ? 2 : 1;
          sm[i] = sm[i] && sm[i] !== v && F.t[i] !== T.FLOOR && F.t[i] !== T.STAIR ? 0 : v;
        }
      });
      for (let y = land[1]; y <= land[3]; y++) for (let x = land[0]; x <= land[2]; x++) sm[F.i(x, y)] = 1;
      F.storyMap = sm;
      F._st = 1;
      F.storyNow = () => {
        const p = SX.actors && SX.actors.player;
        if (p) {
          const px = Math.floor(p.x), py = Math.floor(p.y);
          if (F.in(px, py) && sm[F.i(px, py)]) F._st = sm[F.i(px, py)];
        }
        return F._st;
      };
      F.storyOff = (x, y) => {
        if (!F.in(x, y)) return false;
        const m = sm[F.i(x, y)];
        return m !== 0 && m !== F.storyNow();
      };
    }
    F.homeRooms = R.slice(1);
    F.wallH = 48;
    F.winBars = !!P.winBars;
    {
      const sr = R.find(r => r.secret);
      if (sr && secDoor) {
        F.secret = {
          x0: sr.x0,
          y0: sr.y0,
          x1: sr.x1,
          y1: sr.y1,
          door: secDoor
        };
        F.secretShut = () => {
          const s = F.secret, d = s.door;
          if (d.open || d.slide && performance.now() - d.slide.t0 < 800) return false;
          const p = SX.actors && SX.actors.player;
          return !(p && p.x >= s.x0 && p.x < s.x1 + 1 && p.y >= s.y0 && p.y < s.y1 + 1);
        };
        F.hideAt = (x, y) => {
          const s = F.secret;
          if (x < s.x0 || x > s.x1 || y < s.y0 || y > s.y1) return false;
          return F.secretShut();
        };
        F.ceilAt = F.hideAt;
      }
    }
    {
      const sv = F.voidAt, so = F.storyOff, hd = F.hideAt;
      if (so) F.voidAt = sv ? (x, y) => sv(x, y) || so(x, y) : so;
      if (hd || so) F.seeOff = hd && so ? (x, y) => hd(x, y) || so(x, y) : hd || so;
    }
    F.noPropOcc = true;
    F.wallCol = SX.home.partWall(parts[0], hv) || null;
    {
      const NB = [ [ 0, 1 ], [ 0, -1 ], [ -1, 0 ], [ 1, 0 ], [ -1, 1 ], [ 1, 1 ], [ -1, -1 ], [ 1, -1 ] ];
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const i = F.i(x, y), tt = F.t[i];
        if (tt !== T.WALL && tt !== T.WINDOW && tt !== T.DOOR || wallCols[i]) continue;
        for (const [dx, dy] of NB) {
          if (!F.in(x + dx, y + dy)) continue;
          const rk = F.room[F.i(x + dx, y + dy)];
          if (rk >= 0 && parts[rk] && F.t[F.i(x + dx, y + dy)] === T.FLOOR) {
            wallCols[i] = SX.home.partWall(parts[rk], hv);
            break;
          }
        }
      }
      F.wallColAt = (x, y) => F.in(x, y) && wallCols[F.i(x, y)] || F.wallCol;
    }
    F.tintAt = home.floorCol ? (tx, ty) => F.inside[F.i(tx, ty)] ? home.floorCol : null : null;
    if (SX.homeSurf && SX.homeSurf.build) SX.homeSurf.build(F, t, home, parts);
    const fixOcc = [];
    for (const fx of P.fixtures || []) {
      const sz = SX.art.propDims ? SX.art.propDims(fx.kind, 0) : null;
      if (!sz || !SX.art.propSize(fx.kind)) continue;
      const p = addProp(F, fx.kind, ox + fx.x, oy + fx.y, {
        v: fx.v | 0,
        solid: true,
        hit: SX.art.propHit ? SX.art.propHit(fx.kind, 0) : null
      });
      if (!p) continue;
      p.fixture = true;
      for (let yy = 0; yy < sz.fh; yy++) for (let xx = 0; xx < sz.fw; xx++) fixOcc.push([ ox + fx.x + xx, oy + fx.y + yy ]);
    }
    {
      const fxs = new Set, cls = new Set;
      for (const [xx, yy] of fixOcc) if (F.in(xx, yy)) fxs.add(F.i(xx, yy));
      for (const c of P.clear || []) for (let y = oy + c.y0; y <= oy + c.y1; y++) for (let x = ox + c.x0; x <= ox + c.x1; x++) if (F.in(x, y)) {
        cls.add(F.i(x, y));
        keep.add(F.i(x, y));
        dks.delete(F.i(x, y));
      }
      if (fxs.size) F.fixAt = (x, y) => F.in(x, y) && fxs.has(F.i(x, y));
      if (fxs.size || cls.size || dks.size) for (const f of home.furn || []) {
        if (!f.placed || f.x == null || SX.ride && SX.ride.isOn(f)) continue;
        const cat = SX.home && SX.home.FURN[f.kind];
        if (!cat || cat.wall || !SX.home.solidCells) continue;
        if (SX.home.solidCells(f.kind, f.x, f.y, f.rot | 0).some(([xx, yy]) => F.in(xx, yy) && (fxs.has(F.i(xx, yy)) || !cat.flat && cls.has(F.i(xx, yy))))) f.placed = false; else if (!cat.flat && dks.size && SX.home.blockCells && SX.home.blockCells(F, f.kind, f.x, f.y, f.rot | 0).some(([xx, yy]) => F.in(xx, yy) && dks.has(F.i(xx, yy)))) f.placed = false;
      }
    }
    if (SX.home && SX.home.ensureBuiltin) {
      SX.home.ensureBuiltin(home);
      if (F.secret) F.secret.shelf = home.furn.find(f => f.kind === "secretShelf") || null;
      const occ = new Uint8Array(W * H);
      for (const [xx, yy] of fixOcc) if (F.in(xx, yy)) occ[F.i(xx, yy)] = 1;
      for (const f of home.furn) if (f.placed && f.x != null && !(SX.ride && SX.ride.isOn(f))) {
        const sz = SX.art.propDims(f.kind, f.rot | 0);
        if (sz) for (let yy = Math.floor(f.y); yy < Math.ceil(f.y + sz.fh); yy++) for (let xx = Math.floor(f.x); xx < Math.ceil(f.x + sz.fw); xx++) if (F.in(xx, yy)) occ[F.i(xx, yy)] = 1;
      }
      const free = (x, y, sz) => {
        for (let yy = y; yy < y + sz.fh; yy++) for (let xx = x; xx < x + sz.fw; xx++) {
          if (F.tile(xx, yy) !== T.FLOOR || occ[F.i(xx, yy)] || F.keepAt(xx, yy)) return false;
          if (M.doorFront(door, xx, yy)) return false;
        }
        return true;
      };
      if ((home.tier | 0) === SX.home.STATION_TIER) for (const [st, kind, sx, sy] of SX.home.STATION) {
        const f = home.furn.find(q => q.builtin && q.st === st), cat = SX.home.FURN[kind], sz = SX.art.propDims(kind, 0);
        if (!f || f.placed || f.stored || !cat || !sz) continue;
        const px = ox + sx, py = oy + sy, E = 1e-6;
        const hit = home.furn.some(q => {
          if (q === f || !q.placed || q.x == null || SX.ride && SX.ride.isOn(q)) return false;
          const c = SX.home.FURN[q.kind], qz = c && !c.wall && !!c.flat === !!cat.flat ? SX.art.propDims(q.kind, q.rot | 0) : null;
          return !!qz && q.x < px + sz.fw - E && px < q.x + qz.fw - E && q.y < py + sz.fh - E && py < q.y + qz.fh - E;
        });
        f.rot = 0;
        if (hit) {
          f.stored = 1;
          continue;
        }
        f.x = px;
        f.y = py;
        f.placed = true;
        for (let yy = py; yy < py + sz.fh; yy++) for (let xx = px; xx < px + sz.fw; xx++) if (F.in(xx, yy)) occ[F.i(xx, yy)] = 1;
      }
      const main = R[0];
      for (const [kind, dx, dy] of SX.home.builtinSpots(home.tier | 0)) {
        const f = home.furn.find(q => q.kind === kind && q.builtin);
        if (!f || f.placed || f.stored) continue;
        const sz = SX.art.propDims(kind, 0);
        if (!sz) continue;
        f.rot = 0;
        let px = dx >= 0 ? main.x0 + dx : main.x1 + 1 + dx - sz.fw + 1, py = dy >= 0 ? main.y0 + dy : main.y1 + 1 + dy - sz.fh + 1;
        if (!free(px, py, sz)) {
          let found = null;
          for (const r of R) {
            if (r.secret) continue;
            for (let yy = r.y0; yy <= r.y1 - sz.fh + 1 && !found; yy++) for (let xx = r.x0; xx <= r.x1 - sz.fw + 1 && !found; xx++) if (free(xx, yy, sz)) found = [ xx, yy ];
            if (found) break;
          }
          if (found) {
            px = found[0];
            py = found[1];
          }
        }
        f.x = px;
        f.y = py;
        f.placed = true;
        for (let yy = py; yy < py + sz.fh; yy++) for (let xx = px; xx < px + sz.fw; xx++) if (F.in(xx, yy)) occ[F.i(xx, yy)] = 1;
      }
    }
    const kinds = SX.home ? SX.home.builtinKinds(home.tier | 0) : [];
    for (const f of home.furn || []) {
      if (!f.placed) continue;
      if (SX.ride && SX.ride.isOn(f)) continue;
      const cat = SX.home && SX.home.FURN[f.kind];
      if (!cat) continue;
      if (f.builtin && !kinds.includes(f.kind)) {
        f.placed = false;
        continue;
      }
      if (!SX.art.propSize(f.kind)) {
        f.placed = false;
        continue;
      }
      {
        const cells = SX.home.solidCells ? SX.home.solidCells(f.kind, f.x, f.y, f.rot | 0) : [];
        if (cells.some(([xx, yy]) => F.tile(xx, yy) !== T.FLOOR)) {
          f.placed = false;
          continue;
        }
      }
      const p = addProp(F, f.kind, f.x, f.y, {
        v: f.v | 0,
        rot: f.rot | 0,
        solid: !cat.flat && !cat.wall,
        tall: !!cat.tall,
        hit: cat.flat || cat.wall ? null : SX.art.propHit(f.kind, f.rot | 0),
        npc: cat.use ? {
          role: cat.use,
          name: cat.name,
          furn: f
        } : null
      });
      if (!p) {
        f.placed = false;
        continue;
      }
      p.col = f.col || null;
      p.furn = f;
      p.items = f.items || null;
      p.flat = !!cat.flat;
    }
    if (SX.ride) SX.ride.sync(F, home);
    for (const r of R) {
      const rw = r.x1 - r.x0 + 1, rh = r.y1 - r.y0 + 1, nL = Math.max(1, Math.round(rw * rh / 70));
      for (let k = 0; k < nL; k++) F.lamps.push({
        x: r.x0 + (k + .5) * rw / nL,
        y: r.y0 + rh * .45,
        r: Math.max(6, Math.max(rw / nL, rh) * .9),
        c: [ 255, 214, 160 ],
        a: .75,
        hid: r.secret || undefined
      });
    }
    if (P.river && !P.river.out) {
      const bk = P.river.bank | 0;
      for (let x = 2, k = 0; x < W - 1; x += 4, k++) {
        const c = k % 5 === 2 ? k % 2 ? [ 255, 90, 190 ] : [ 90, 200, 255 ] : [ 255, 205, 130 ];
        F.lamps.push({
          x: x + .5,
          y: bk - .6,
          r: 2.6,
          c,
          a: .55
        });
        F.lamps.push({
          x: x + .5,
          y: bk + 1.4,
          r: 1.6,
          c,
          a: .25
        });
      }
    }
    for (const s of P.strips || []) if (s.glow) {
      const a = ox + s.x0, c = ox + s.x1, n = Math.max(1, Math.round((c - a + 1) / 9));
      for (let k = 0; k < n; k++) F.lamps.push({
        x: a + (k + .5) * (c - a + 1) / n,
        y: oy + s.y0 + .3,
        r: 4.5,
        c: s.glow,
        a: .55,
        flicker: k % 2 === 1
      });
      if (s.seal) for (const ex of [ a + 1.6, c - .6 ]) F.lamps.push({
        x: ex,
        y: oy + s.y0 + 1.2,
        r: 1.8,
        c: [ 255, 60, 40 ],
        a: .45,
        flicker: true
      });
    }
    M.homeLights(F);
    if (SX.homeOut) SX.homeOut.setup(F, t, P, ox, oy);
    F.spawn = {
      x: ox + P.spawn.x,
      y: oy + P.spawn.y
    };
    for (const l of home.loose || []) SX.home.placeLoose(F, l);
    return {
      hub: true,
      scene: "home",
      W,
      H,
      floors: [ F ],
      interior: {
        x0,
        y0,
        x1,
        y1
      },
      door,
      plan: P
    };
  };
  M.homeLights = function(F) {
    F.lamps = F.lamps.filter(l => !l.furn);
    for (const p of F.props) {
      if (!p.furn) continue;
      const cat = SX.home.FURN[p.kind];
      if (!cat || !cat.light) continue;
      if (SX.homeUse && !SX.homeUse.lit(p)) continue;
      const [r, g, b] = cat.light === "col" && p.col ? SX.art.hexRgb(p.col) : cat.lightCol || [ 255, 200, 140 ];
      F.lamps.push({
        x: p.x + p.w / 2,
        y: p.y + p.h / 2,
        r: cat.lightR || 5,
        c: [ r, g, b ],
        a: .8,
        furn: true,
        flicker: !!cat.flicker,
        prop: p
      });
    }
    if (SX.top) SX.top.lights(F);
  };
  M.MARKET_STALLS = [ {
    role: "gun",
    name: "무기상"
  }, {
    role: "ammo",
    name: "탄약상"
  }, {
    role: "med",
    name: "약재상"
  }, {
    role: "gear",
    name: "방어구상"
  }, {
    role: "furn",
    name: "가구점"
  }, {
    role: "broker",
    name: "브로커(물건 판매)"
  }, {
    role: "smuggle",
    name: "밀수꾼"
  }, {
    role: "merc",
    name: "용병소"
  }, {
    role: "insure",
    name: "보험·정보 창구"
  }, {
    role: "estate",
    name: "부동산(이사)"
  } ];
  const STALL_V = {
    gun: 0,
    ammo: 1,
    med: 2,
    gear: 3,
    broker: 4,
    smuggle: 5,
    merc: 6,
    insure: 7,
    furn: 8,
    estate: 9,
    gym: 6
  };
  M.RANGE_D = [ 9, 10, 11, 13, 25 ];
  M.RANGE_OLD = {
    1: {
      50: 9,
      75: 11,
      100: 13
    },
    2: {
      46: 9,
      48: 11,
      50: 13
    }
  };
  M.rangeRec = function(s) {
    if (!s) return null;
    const r = s.range || (s.range = {
      best: 0,
      hits: 0,
      v: 3
    });
    const v = r.v | 0;
    if (v < 3) {
      const b = +r.best || 0, map = M.RANGE_OLD[v >= 2 ? 2 : 1];
      r.best = map[b] || Math.min(b, Math.max(...M.RANGE_D));
      r.v = 3;
    }
    return r;
  };
  M.buildRange = function() {
    const FAR = Math.max(...M.RANGE_D), FIRE = 8, W = FIRE + FAR + 4, H = 16;
    const F = new Floor(W, H, 0, "hub");
    F.autoHit = true;
    fillRect(F, 0, 0, W - 1, H - 1, T.VOID, FS.VOID, -1);
    const x0 = 1, y0 = 1, x1 = W - 2, y1 = H - 2;
    fillRect(F, x0, y0, x1, y1, T.GROUND, FS.ASPH, 1);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) F.inside[F.i(x, y)] = 1;
    hwall(F, x0 - 1, x1 + 1, y0 - 1, 0);
    hwall(F, x0 - 1, x1 + 1, y1 + 1, 0);
    vwall(F, x0 - 1, y0 - 1, y1 + 1, 0);
    vwall(F, x1 + 1, y0 - 1, y1 + 1, 0);
    F.rooms.push({
      id: 1,
      theme: "range",
      x0,
      y0,
      x1,
      y1
    });
    F.npcs = [];
    F.targets = [];
    const back = addDoor(F, x0 - 1, 7, false, 2, {
      back: true
    });
    back.open = false;
    for (let y = y0; y <= y1; y++) F.fs[F.i(FIRE, y)] = FS.WALK;
    for (let d = 10; d <= FAR; d += 10) {
      const x = FIRE + d;
      if (x > x1) break;
      for (let y = y0; y <= y1; y++) F.fs[F.i(x, y)] = FS.LANE;
    }
    const tgt = (kind, x, y, dist) => {
      const pr = addProp(F, kind, x, y, {
        solid: false
      });
      if (!pr) return;
      pr.target = {
        dist,
        hitT: 0,
        hits: 0
      };
      F.targets.push(pr);
    };
    const LANE = {
      10: 3,
      25: 12,
      9: 5,
      11: 10,
      13: 7
    };
    for (const d of M.RANGE_D) {
      for (let x = FIRE + 1; x <= FIRE + d; x++) F.fs[F.i(x, LANE[d])] = FS.WALK;
      tgt("rangePlate", FIRE + d, LANE[d], d);
    }
    for (const [d, y] of [ [ 5, 2 ], [ 8, 13 ], [ 12, 2 ], [ 18, 13 ] ]) {
      for (let x = FIRE + 1; x <= FIRE + d; x++) F.fs[F.i(x, y)] = FS.WALK;
      tgt("silh", FIRE + d, y, d);
    }
    addProp(F, "barrier", FIRE - 2, 6, {});
    addProp(F, "barrier", FIRE - 2, 9, {});
    addProp(F, "crate", FIRE - 4, 4, {});
    addProp(F, "drum", FIRE - 4, 10, {});
    addProp(F, "board", FIRE - 5, 7, {
      npc: {
        role: "rangeDesk",
        name: "사격장 관리대"
      },
      solid: false
    });
    for (let x = FIRE; x < x1; x += 14) F.lamps.push({
      x: x + .5,
      y: 7.5,
      r: 12,
      c: [ 220, 230, 255 ],
      a: .7
    });
    F.lamps.push({
      x: FIRE - 3,
      y: 7.5,
      r: 10,
      c: [ 255, 220, 170 ],
      a: .6
    });
    F.spawn = {
      x: FIRE - 3.5,
      y: 7.5
    };
    F.wallH = 48;
    return {
      hub: true,
      scene: "range",
      W,
      H,
      floors: [ F ],
      fire: FIRE
    };
  };
  M.buildGym = function() {
    const W = 24, H = 15;
    const F = new Floor(W, H, 0, "hub");
    F.autoHit = true;
    fillRect(F, 0, 0, W - 1, H - 1, T.VOID, FS.VOID, -1);
    const x0 = 1, y0 = 1, x1 = W - 2, y1 = H - 2;
    fillRect(F, x0, y0, x1, y1, T.FLOOR, FS.WOOD, 1);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) F.inside[F.i(x, y)] = 1;
    hwall(F, x0 - 1, x1 + 1, y0 - 1, 0);
    hwall(F, x0 - 1, x1 + 1, y1 + 1, 0);
    vwall(F, x0 - 1, y0 - 1, y1 + 1, 0);
    vwall(F, x1 + 1, y0 - 1, y1 + 1, 0);
    for (let x = x0 + 1; x < 11; x += 4) F.set(x, y0 - 1, T.WINDOW);
    F.rooms.push({
      id: 1,
      theme: "gym",
      x0,
      y0,
      x1,
      y1
    });
    F.npcs = [];
    const back = addDoor(F, x0 + Math.floor(W / 2) - 1, y0 - 1, true, 2, {
      back: true
    });
    back.open = false;
    const FEE = " · 이용료 25만";
    const ex = (kind, x, y, role, name, gym, o) => {
      const p = addProp(F, kind, x, y, Object.assign({
        npc: {
          role,
          name: name + FEE
        }
      }, o || {}));
      if (p) p.gym = gym;
      return p;
    };
    const deco = (kind, x, y, gym, o) => {
      const p = addProp(F, kind, x, y, o || {});
      if (p && gym) p.gym = gym;
      return p;
    };
    const mat = (x, y, gym, rope) => {
      const p = rope ? ex("ropeMat", x, y, "exRope", "줄넘기 — 지구력", "rope", {
        solid: false
      }) : deco("ropeMat", x, y, gym, {
        solid: false
      });
      if (p) p.flat = true;
      return p;
    };
    for (const y of [ 2, 5 ]) for (const x of [ 2, 5, 8 ]) ex("treadmill", x, y, "exRun", "러닝머신 — 체력", "run");
    for (const x of [ 2, 5, 8 ]) ex("exBike", x, 8, "exRun", "실내 자전거 — 체력", "bike");
    mat(2, 10, null, true);
    mat(5, 10, null, true);
    mat(8, 10, "stretch");
    for (const x of [ 15, 19 ]) ex("barbell", x, 2, "exStr", "역기 — 근력", "str");
    ex("squatRack", 15, 5, "exStr", "스쿼트 랙 — 근력", "squat");
    ex("squatRack", 18, 5, "exStr", "스쿼트 랙 — 근력", "squat");
    deco("plateTree", 21, 6);
    deco("kettleRow", 18, 8, "curl");
    deco("dumbbellRack", 15, 8, "curl");
    deco("dumbbellRack", 20, 8, "curl");
    for (const x of [ 14, 16, 18, 20 ]) ex("punchBag", x, 11, "exBag", "샌드백 — 치명타", "bag");
    ex("barbell", 11, 9, "exStr", "역기 — 근력", "str");
    mat(11, 6, "stretch");
    for (const x of [ 15, 19 ]) deco("gymMirror", x, y0, null);
    deco("poster", 4, y0, null);
    deco("poster", 8, y0, null);
    for (let x = x0; x <= x0 + 3; x++) deco("locker", x, y1);
    deco("bench", 6, y1 - 1, "rest");
    deco("bench", 12, y1 - 1, "rest");
    deco("waterCooler", 9, y1 - 1, "drink");
    deco("waterCooler", x1, 9, "drink");
    deco("drum", x1, 4, null);
    deco("plant", 10, y0 + 1, null);
    deco("plant", 14, y0 + 1, null);
    for (const x of [ 3, 8, 12, 17, 20 ]) for (const y of [ 3, 9 ]) F.lamps.push({
      x: x + .5,
      y: y + .5,
      r: 8,
      c: [ 255, 235, 200 ],
      a: .6
    });
    F.spawn = {
      x: x0 + Math.floor(W / 2) - .5,
      y: y0 + 1.5
    };
    F.wallH = 48;
    return {
      hub: true,
      scene: "gym",
      W,
      H,
      floors: [ F ]
    };
  };
  M.buildFish = function() {
    const W = 24, H = 16, BANK = 8;
    const F = new Floor(W, H, 0, "hub");
    F.autoHit = true;
    fillRect(F, 0, 0, W - 1, H - 1, T.VOID, FS.WATER, -1);
    const x0 = 1, y0 = 1, x1 = W - 2, y1 = BANK;
    fillRect(F, x0, y0, x1, y1, T.GROUND, FS.DIRT, 1);
    for (let x = x0; x <= x1; x++) {
      F.fs[F.i(x, y0)] = FS.ASPH;
      F.fs[F.i(x, y0 + 1)] = FS.ASPH;
      F.fs[F.i(x, y1)] = FS.WALK;
    }
    {
      const rng = new SX.Rng(20261014);
      for (let y = y0 + 2; y < y1; y++) for (let x = x0; x <= x1; x++) if (rng.f() < .45) F.fs[F.i(x, y)] = FS.GRASS;
    }
    hwall(F, 0, W - 1, 0, 0);
    vwall(F, 0, 0, y1, 0);
    vwall(F, x1 + 1, 0, y1, 0);
    F.rooms.push({
      id: 1,
      theme: "fish",
      x0,
      y0,
      x1,
      y1
    });
    F.npcs = [];
    const back = addDoor(F, 12, 0, true, 2, {
      back: true
    });
    back.open = false;
    for (let y = BANK + 1; y <= BANK + 4; y++) for (let x = 10; x <= 13; x++) F.set(x, y, T.GROUND, FS.WOOD);
    F.fishSpots = [];
    for (const x of [ 10, 11, 12, 13 ]) F.fishSpots.push({
      x: x + .5,
      y: BANK + 4.55,
      pier: true
    });
    for (const x of [ 3, 6, 17, 20 ]) F.fishSpots.push({
      x: x + .5,
      y: BANK + .55
    });
    {
      const sx = 4, sy = 2, p = addProp(F, "stall", sx, sy, {
        v: 10,
        npc: {
          role: "fishShop",
          name: "낚시 가게"
        }
      });
      if (p) p.fishShop = true;
      F.npcs.push({
        x: sx + 3.5,
        y: sy + 1.8,
        role: "fishShop",
        name: "낚시 가게 — 강태공",
        spec: SX.art.charSpec("trader", new SX.Rng(20261015)),
        dir: 0,
        stall: {
          x: sx + 1.5,
          y: sy + 1
        }
      });
    }
    addProp(F, "fire", 15, 5, {
      npc: {
        role: "grill",
        name: "모닥불 — 생선 굽기"
      },
      solid: true
    });
    F.lamps.push({
      x: 15.5,
      y: 5.3,
      r: 7,
      c: [ 255, 150, 70 ],
      a: 1,
      flicker: true
    });
    addProp(F, "bench", 17, 5, {});
    addProp(F, "crate", 19, 3, {
      v: 2
    });
    addProp(F, "drum", 21, 3, {
      v: 1
    });
    addProp(F, "trash", x0, 5, {});
    addProp(F, "crate", 2, 7, {
      v: 0
    });
    addProp(F, "boxes", 9, 3, {});
    for (const x of [ 2, 14, 21 ]) {
      addProp(F, "lamp", x, y0, {});
      F.lamps.push({
        x: x + .7,
        y: y0 + .4,
        r: 9,
        c: [ 255, 225, 180 ],
        a: .55
      });
    }
    for (const x of [ 5, 18 ]) {
      addProp(F, "lamp", x, BANK - 1, {});
      F.lamps.push({
        x: x + .7,
        y: BANK - .6,
        r: 10,
        c: [ 255, 225, 180 ],
        a: .6
      });
    }
    F.lamps.push({
      x: 11.5,
      y: BANK + 3.5,
      r: 9,
      c: [ 200, 220, 255 ],
      a: .5
    });
    for (const x of [ 3, 9, 15, 21 ]) F.lamps.push({
      x: x + .5,
      y: BANK + 5.5,
      r: 8,
      c: [ 120, 160, 220 ],
      a: .3
    });
    F.spawn = {
      x: 13,
      y: y0 + .8
    };
    F.wallH = 48;
    return {
      hub: true,
      scene: "fish",
      W,
      H,
      floors: [ F ],
      bank: BANK
    };
  };
  M.buildMarket = function() {
    const W = 28, H = 20;
    const F = new Floor(W, H, 0, "hub");
    F.autoHit = true;
    const rng = new SX.Rng(20260919);
    fillRect(F, 0, 0, W - 1, H - 1, T.VOID, FS.VOID, -1);
    const x0 = 2, y0 = 2, x1 = W - 3, y1 = H - 3;
    fillRect(F, x0, y0, x1, y1, T.GROUND, FS.ASPH, 1);
    for (let x = x0; x <= x1; x++) {
      F.fs[F.i(x, y0)] = FS.WALK;
      F.fs[F.i(x, y1)] = FS.WALK;
    }
    for (let y = y0; y <= y1; y++) F.fs[F.i(x0, y)] = FS.WALK;
    hwall(F, x0 - 1, x1 + 1, y0 - 1, 0);
    hwall(F, x0 - 1, x1 + 1, y1 + 1, 0);
    vwall(F, x0 - 1, y0 - 1, y1 + 1, 0);
    vwall(F, x1 + 1, y0 - 1, y1 + 1, 0);
    for (let x = x0 + 1; x < x1; x += 4) F.set(x, y0 - 1, T.WINDOW);
    const gate = addDoor(F, x0 - 1, 9, false, 2, {
      market: true
    });
    gate.open = true;
    F.rooms.push({
      id: 1,
      theme: "market",
      x0,
      y0,
      x1,
      y1
    });
    F.npcs = [];
    M.MARKET_STALLS.forEach((st, k) => {
      const top = k < 5, x = 5 + k % 5 * 4, y = top ? y0 + 1 : y1 - 2;
      const p = addProp(F, "stall", x, y, {
        v: STALL_V[st.role],
        npc: st
      });
      F.npcs.push({
        x: x + 3.5,
        y: top ? y + 1.8 : y + .9,
        role: st.role,
        name: st.name,
        spec: SX.art.charSpec("trader", new SX.Rng(k * 17 + 3)),
        dir: top ? 0 : 2,
        stall: {
          x: x + 1.5,
          y: y + 1
        }
      });
    });
    addProp(F, SX.art.propSize("mapBoard") ? "mapBoard" : "sign", x0 + 1, 7, {
      npc: {
        role: "map",
        name: "도심 지도(이동)"
      }
    });
    for (const [x, y] of [ [ 9, 9 ], [ 21, 10 ] ]) {
      addProp(F, "fire", x, y, {});
      F.lamps.push({
        x: x + .5,
        y: y + .3,
        r: 7,
        c: [ 255, 150, 70 ],
        a: 1,
        flicker: true
      });
    }
    addProp(F, "bench", 14, 9, {});
    addProp(F, "trash", 24, 8, {});
    addProp(F, "barrier", 16, 11, {});
    const gd = addDoor(F, x1 + 1, 13, false, 2, {
      gym: true
    });
    gd.open = false;
    addProp(F, "sign", x1 - 1, 12, {
      v: 13,
      solid: false
    });
    addProp(F, "bench", 8, 12, {});
    addProp(F, "bench", 20, 13, {});
    for (const [x, y] of [ [ 11, 6 ] ]) {
      addProp(F, "fire", x, y, {});
      F.lamps.push({
        x: x + .5,
        y: y + .3,
        r: 7,
        c: [ 255, 150, 70 ],
        a: 1,
        flicker: true
      });
    }
    const rd = addDoor(F, x1 + 1, 9, false, 2, {
      range: true
    });
    rd.open = false;
    addProp(F, "sign", x1 - 1, 7, {
      v: 12,
      solid: false
    });
    const fd = addDoor(F, x0 - 1, 13, false, 2, {
      fish: true
    });
    fd.open = false;
    addProp(F, "sign", x0, 12, {
      v: 14,
      solid: false
    });
    for (const x of [ 4, 12, 20 ]) addProp(F, "sign", x, y0 - 1 + 1, {
      v: 8 + (x >> 3),
      solid: false
    });
    if (SX.art.propSize("bigBoard")) for (const x of [ 6, 15 ]) addProp(F, "bigBoard", x, y0, {
      solid: false
    });
    F.lamps.push({
      x: 14,
      y: 9.5,
      r: 11,
      c: [ 255, 220, 170 ],
      a: .55
    });
    for (const p of F.props) if (p.kind === "bench") p.npc = {
      role: "sit",
      name: "긴 의자 — 앉기"
    };
    F.spawn = {
      x: x0 + 1.2,
      y: 10
    };
    F.wallH = 48;
    return {
      hub: true,
      scene: "market",
      W,
      H,
      floors: [ F ],
      gate
    };
  };
})(window.SX);
