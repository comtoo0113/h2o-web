"use strict";

(function(SX) {
  const T = SX.map.T, A = SX.actors;
  const MM = SX.minimap = {};
  const COL = {
    room: [ 44, 64, 50 ],
    cor: [ 34, 50, 40 ],
    ground: [ 26, 38, 31 ],
    wall: [ 150, 214, 150 ],
    win: [ 120, 184, 200 ],
    door: [ 216, 192, 112 ],
    exit: [ 110, 240, 130 ],
    stair: [ 232, 224, 160 ],
    prop: [ 58, 84, 66 ],
    outline: [ 52, 80, 58 ]
  };
  function paintTile(F, i) {
    const t = F.t[i], d = F.mmImg.data, o = i * 4;
    let c = null;
    if (t === T.FLOOR) c = F.solid[i] ? COL.prop : F.room[i] >= 0 ? COL.room : COL.cor; else if (t === T.GROUND) c = F.solid[i] ? COL.prop : COL.ground; else if (t === T.WALL || t === T.PARAPET) c = COL.wall; else if (t === T.WINDOW) c = COL.win; else if (t === T.DOOR) {
      const dd = F.doorAt.get(i);
      c = dd && dd.exit ? COL.exit : COL.door;
    } else if (t === T.STAIR) c = COL.stair;
    if (!c) return;
    d[o] = c[0];
    d[o + 1] = c[1];
    d[o + 2] = c[2];
    d[o + 3] = 255;
  }
  function ensure(F) {
    if (F.mm) return;
    F.mm = SX.art.mk(F.W, F.H);
    F.mmCtx = F.mm.getContext("2d");
    F.mmImg = F.mmCtx.createImageData(F.W, F.H);
    F.seen = new Uint8Array(F.W * F.H);
  }
  MM.prepare = function(lv) {
    for (const F of lv.floors) {
      ensure(F);
      const d = F.mmImg.data;
      for (let x = lv.X0; x <= lv.X1; x++) for (const y of [ lv.Y0, lv.Y1 ]) {
        const o = F.i(x, y) * 4;
        d[o] = COL.outline[0];
        d[o + 1] = COL.outline[1];
        d[o + 2] = COL.outline[2];
        d[o + 3] = 255;
      }
      for (let y = lv.Y0; y <= lv.Y1; y++) for (const x of [ lv.X0, lv.X1 ]) {
        const o = F.i(x, y) * 4;
        d[o] = COL.outline[0];
        d[o + 1] = COL.outline[1];
        d[o + 2] = COL.outline[2];
        d[o + 3] = 255;
      }
      for (const s of F.stairs) for (let y = s.y; y < s.y + s.h; y++) for (let x = s.x; x < s.x + s.w; x++) {
        const i = F.i(x, y);
        paintTile(F, i);
      }
      F.mmDirty = true;
    }
  };
  MM.reveal = function(F) {
    if (!F || !F.mmImg || SX.light.visF !== F) return;
    const b = SX.light.box, vis = SX.light.vis;
    if (!b) return;
    let n = 0;
    for (let y = b.y0; y <= b.y1; y++) for (let x = b.x0; x <= b.x1; x++) {
      const i = y * F.W + x;
      if (!vis[i] || F.seen[i]) continue;
      F.seen[i] = 1;
      paintTile(F, i);
      n++;
    }
    if (n) F.mmDirty = true;
  };
  MM.revealAll = function(lv) {
    for (const F of lv.floors) {
      ensure(F);
      for (let y = Math.max(0, lv.Y0); y <= Math.min(F.H - 1, lv.Y1); y++) for (let x = Math.max(0, lv.X0); x <= Math.min(F.W - 1, lv.X1); x++) {
        const i = y * F.W + x;
        if (F.seen[i]) continue;
        F.seen[i] = 1;
        paintTile(F, i);
      }
      F.mmDirty = true;
    }
  };
  function flush(F) {
    if (F.mmDirty) {
      F.mmCtx.putImageData(F.mmImg, 0, 0);
      F.mmDirty = false;
    }
  }
  function boxImg(F, b) {
    const bw = b.x1 - b.x0 + 1, bh = b.y1 - b.y0 + 1, im = b.im || (b.im = SX.art.mk(bw, bh)), c = im.getContext("2d");
    c.clearRect(0, 0, bw, bh);
    c.drawImage(F.mm, b.x0, b.y0, bw, bh, 0, 0, bw, bh);
    return im;
  }
  function found(F, v) {
    if (v.mmSeen) return true;
    const r = v.r, sn = F.seen;
    if (!sn) return false;
    let ok = v.door.tiles.some(i => sn[i]);
    for (let y = r.y0; !ok && y <= r.y1; y++) for (let x = r.x0; x <= r.x1; x++) if (sn[y * F.W + x]) {
      ok = true;
      break;
    }
    return ok && (v.mmSeen = true);
  }
  function pois(lv, f) {
    const F = lv.floors[f], out = [];
    for (const s of F.stairs) {
      const to = lv.floors[s.to];
      out.push({
        kind: s.dir === "up" ? s.locked ? "uplock" : "up" : "down",
        x: s.x + s.w / 2,
        y: s.y + s.h / 2,
        roof: to && to.kind === "roof"
      });
    }
    for (const z of F.zones) out.push({
      kind: z.locked ? "lock" : "exit",
      x: z.x + z.w / 2,
      y: z.y + z.h / 2,
      label: z.label
    });
    for (const v of [ F.vault, F.ctrl ]) if (v && v.r && v.door && found(F, v)) out.push({
      kind: v.door.locked ? "vault" : "vaultOpen",
      x: (v.r.x0 + v.r.x1 + 1) / 2,
      y: (v.r.y0 + v.r.y1 + 1) / 2
    });
    for (const q of SX.raid.pings || []) if (q.f === f) out.push({
      kind: "ping",
      x: q.x,
      y: q.y
    });
    if (SX.traps) for (const q of SX.traps.pois(F)) out.push(q);
    if (SX.raid.dropAt && SX.raid.dropAt.cont.grid.list.length && f === lv.roofIdx) out.push({
      kind: "drop",
      x: SX.raid.dropAt.x,
      y: SX.raid.dropAt.y
    });
    if (SX.ev && SX.ev.pois) for (const q of SX.ev.pois(f)) out.push(q);
    if (SX.bdev && SX.bdev.pois) for (const q of SX.bdev.pois(f)) out.push(q);
    if (SX.week && SX.week.pois) for (const q of SX.week.pois(f)) out.push(q);
    if (SX.mis && SX.mis.pois) for (const q of SX.mis.pois(f)) out.push(q);
    const b = lv.mapBox;
    return b ? out.filter(q => q.kind === "ping" || q.x >= b.x0 && q.x <= b.x1 + 1 && q.y >= b.y0 && q.y <= b.y1 + 1) : out;
  }
  function region(lv) {
    const b = lv.mapBox, m = b ? 2 : 6;
    if (!b) {
      const span = lv.X1 - lv.X0 + 1 + m * 2;
      return {
        x0: lv.X0 - m,
        y0: lv.Y0 - m,
        w: span,
        h: span
      };
    }
    return {
      x0: b.x0 - m,
      y0: b.y0 - m,
      w: b.x1 - b.x0 + 1 + m * 2,
      h: b.y1 - b.y0 + 1 + m * 2
    };
  }
  MM.bigRatio = lv => {
    const R = region(lv);
    return R.h / R.w;
  };
  function icon(ctx, kind, x, y, k) {
    x = Math.round(x);
    y = Math.round(y);
    k = k || 1;
    const s = n => Math.round(n * k);
    ctx.fillStyle = "#000";
    if (kind === "up" || kind === "down" || kind === "uplock") {
      ctx.fillRect(x - s(5), y - s(5), s(10), s(10));
      ctx.fillStyle = kind === "up" ? "#f0e6a0" : kind === "uplock" ? "#d04a44" : "#a0c8f0";
      ctx.fillRect(x - s(4), y - s(4), s(8), s(8));
      ctx.fillStyle = "#1a1a14";
      const d = kind === "down" ? 1 : -1;
      for (let q = 0; q < 3; q++) ctx.fillRect(x - s(3 - q), y + d * s(q - 1) - (d < 0 ? 0 : s(1)), s((3 - q) * 2), s(1));
      if (kind === "uplock") {
        ctx.fillStyle = "#f0e6a0";
        ctx.fillRect(x - s(4), y + s(2), s(8), s(1));
        ctx.fillRect(x - s(4), y - s(2), s(1), s(5));
        ctx.fillRect(x + s(3), y - s(2), s(1), s(5));
      }
    } else if (kind === "exit" || kind === "lock") {
      ctx.fillRect(x - s(6), y - s(6), s(12), s(12));
      ctx.fillStyle = kind === "exit" ? SX.cbc("ok", "#6ef082") : SX.cbc("bad", "#d04a44");
      ctx.fillRect(x - s(5), y - s(5), s(10), s(10));
      ctx.fillStyle = "#0a1a0c";
      ctx.fillRect(x - s(1), y - s(3), s(2), s(6));
      ctx.fillRect(x - s(3), y - s(1), s(6), s(2));
      if (kind === "lock") {
        ctx.fillStyle = "#1a0a0a";
        ctx.fillRect(x - s(3), y - s(3), s(6), s(6));
      }
    } else if (kind === "vault" || kind === "vaultOpen") {
      const o = kind === "vaultOpen", u = o ? s(2) : 0;
      ctx.fillRect(x - s(5), y - s(8) - u, s(10), s(4));
      ctx.fillRect(x - s(5), y - s(8) - u, s(4), s(7));
      if (!o) ctx.fillRect(x + s(1), y - s(8), s(4), s(7));
      ctx.fillRect(x - s(6), y - s(2), s(12), s(10));
      ctx.fillStyle = o ? "#9aa0a4" : "#e4e8ec";
      ctx.fillRect(x - s(4), y - s(7) - u, s(8), s(2));
      ctx.fillRect(x - s(4), y - s(7) - u, s(2), s(6));
      ctx.fillRect(x + s(2), y - s(7) - u, s(2), o ? s(3) : s(6));
      ctx.fillStyle = o ? "#8c7a4a" : "#f0c040";
      ctx.fillRect(x - s(5), y - s(1), s(10), s(8));
      ctx.fillStyle = "#2a1e08";
      ctx.fillRect(x - s(1), y + s(1), s(2), s(2));
      ctx.fillRect(x - s(.5), y + s(3), s(1), s(2));
    } else if (kind === "drop") {
      ctx.fillRect(x - s(6), y - s(6), s(12), s(12));
      ctx.fillStyle = "#e8c040";
      ctx.fillRect(x - s(5), y - s(5), s(10), s(10));
      ctx.fillStyle = "#5a4a1a";
      ctx.fillRect(x - s(5), y - s(1), s(10), s(2));
      ctx.fillRect(x - s(1), y - s(5), s(2), s(10));
    } else if (kind === "trap") {
      ctx.fillRect(x - s(4), y - s(4), s(8), s(8));
      ctx.fillStyle = "#ff5a4a";
      for (let q = -3; q <= 3; q++) {
        ctx.fillRect(x + s(q) - s(.5), y + s(q) - s(.5), s(1.5), s(1.5));
        ctx.fillRect(x + s(q) - s(.5), y - s(q) - s(.5), s(1.5), s(1.5));
      }
    } else if (kind === "bdev") {
      ctx.fillRect(x - s(6), y - s(6), s(12), s(12));
      ctx.fillStyle = "#5ad8e8";
      ctx.fillRect(x - s(5), y - s(5), s(10), s(10));
      ctx.fillStyle = "#0c2a30";
      ctx.fillRect(x - s(3), y - s(3), s(6), s(6));
      ctx.fillRect(x - s(1), y - s(5), s(2), s(10));
      ctx.fillRect(x - s(5), y - s(1), s(10), s(2));
      ctx.fillStyle = "#5ad8e8";
      ctx.fillRect(x - s(1), y - s(1), s(2), s(2));
    } else if (kind === "ping") {
      ctx.beginPath();
      ctx.moveTo(x, y - s(7));
      ctx.lineTo(x + s(6), y);
      ctx.lineTo(x, y + s(7));
      ctx.lineTo(x - s(6), y);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#ff8a5b";
      ctx.beginPath();
      ctx.moveTo(x, y - s(5));
      ctx.lineTo(x + s(4), y);
      ctx.lineTo(x, y + s(5));
      ctx.lineTo(x - s(4), y);
      ctx.closePath();
      ctx.fill();
    }
  }
  function playerArrow(ctx, x, y, a, k) {
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    ctx.rotate(a);
    ctx.scale(k || 1, k || 1);
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.lineTo(-6, -6);
    ctx.lineTo(-3, 0);
    ctx.lineTo(-6, 6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.moveTo(6, 0);
    ctx.lineTo(-4, -4);
    ctx.lineTo(-2, 0);
    ctx.lineTo(-4, 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  MM.VIEW = 60;
  function smallView(lv, p) {
    const b = lv && lv.mapBox;
    if (!b) return {
      V: MM.VIEW,
      sx: p.x - MM.VIEW / 2,
      sy: p.y - MM.VIEW / 2
    };
    const V = Math.max(b.x1 - b.x0 + 1, b.y1 - b.y0 + 1) + 4;
    return {
      V,
      sx: (b.x0 + b.x1 + 1) / 2 - V / 2,
      sy: (b.y0 + b.y1 + 1) / 2 - V / 2
    };
  }
  MM.drawSmall = function(cv) {
    const lv = SX.raid.level, p = A.player;
    if (!lv || !p) return;
    const F = lv.floors[p.floor];
    ensure(F);
    flush(F);
    const ctx = cv.getContext("2d"), W = cv.width, H = cv.height, b = lv.mapBox, {V, sx, sy} = smallView(lv, p), k = W / V;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#070c09";
    ctx.fillRect(0, 0, W, H);
    if (b) {
      const im = boxImg(F, b);
      ctx.drawImage(im, 0, 0, im.width, im.height, (b.x0 - sx) * k, (b.y0 - sy) * k, im.width * k, im.height * k);
    } else ctx.drawImage(F.mm, sx, sy, V, V, 0, 0, W, H);
    if (SX.raid.flood) {
      const d = SX.raid.wDepth(p.floor);
      if (d >= .05) {
        ctx.fillStyle = "rgba(46,120,140," + Math.min(.42, .16 + d * .08).toFixed(2) + ")";
        ctx.fillRect(0, 0, W, H);
      }
    }
    const toS = (x, y) => [ (x - sx) * k, (y - sy) * k ];
    const edge = (x, y, m) => [ SX.clamp(x, m, W - m), SX.clamp(y, m, H - m) ];
    for (const al of A.allies) if (al.alive && al.floor === p.floor) {
      const [x, y] = toS(al.x, al.y);
      ctx.fillStyle = "#000";
      ctx.fillRect(x - 3, y - 3, 6, 6);
      ctx.fillStyle = SX.cbc("ally", "#5ab0ff");
      ctx.fillRect(x - 2, y - 2, 4, 4);
    }
    for (const q of pois(lv, p.floor)) {
      let [x, y] = toS(q.x, q.y);
      const out = x < 6 || y < 6 || x > W - 6 || y > H - 6;
      [x, y] = edge(x, y, 7);
      ctx.globalAlpha = out ? .85 : 1;
      icon(ctx, q.kind, x, y, out ? .8 : 1);
      ctx.globalAlpha = 1;
    }
    playerArrow(ctx, (p.x - sx) * k, (p.y - sy) * k, p.aim, 1);
  };
  MM.drawBig = function(cv, f) {
    const lv = SX.raid.level;
    if (!lv) return;
    const F = lv.floors[f];
    ensure(F);
    flush(F);
    const ctx = cv.getContext("2d"), W = cv.width, H = cv.height;
    const R = region(lv), x0 = R.x0, y0 = R.y0, k = Math.min(W / R.w, H / R.h);
    const ox = lv.mapBox ? Math.round((W - R.w * k) / 2) : 0, oy = lv.mapBox ? Math.round((H - R.h * k) / 2) : 0;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#070c09";
    ctx.fillRect(0, 0, W, H);
    const b = lv.mapBox;
    if (b) {
      const im = boxImg(F, b);
      ctx.drawImage(im, 0, 0, im.width, im.height, ox + (b.x0 - x0) * k, oy + (b.y0 - y0) * k, im.width * k, im.height * k);
    } else ctx.drawImage(F.mm, x0, y0, R.w, R.h, ox, oy, R.w * k, R.h * k);
    if (SX.raid.flood) {
      const d = SX.raid.wDepth(f);
      if (d >= .05) {
        ctx.fillStyle = "rgba(46,120,140," + Math.min(.42, .16 + d * .08).toFixed(2) + ")";
        ctx.fillRect(ox, oy, R.w * k, R.h * k);
      }
    }
    const toS = (x, y) => [ ox + (x - x0) * k, oy + (y - y0) * k ];
    for (const q of pois(lv, f)) {
      const [x, y] = toS(q.x, q.y);
      icon(ctx, q.kind, x, y, 1.4);
    }
    const p = A.player;
    if (p && p.floor === f) {
      const [x, y] = toS(p.x, p.y);
      playerArrow(ctx, x, y, p.aim, 1.5);
    }
    return {
      x0,
      y0,
      k,
      ox,
      oy
    };
  };
  MM.smallToWorld = function(cv, ex, ey) {
    const r = cv.getBoundingClientRect(), {V, sx, sy} = smallView(SX.raid.level, A.player);
    return [ sx + (ex - r.left) / r.width * V, sy + (ey - r.top) / r.height * V ];
  };
})(window.SX);
