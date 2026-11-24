"use strict";

(function(SX) {
  const TS = SX.TS;
  SX.CB_PAL = [ null, {
    ok: "#4fb4ff",
    bad: "#e0401a",
    warn: "#ffe85a",
    hp: "#e8501a",
    hpHi: "#ff9a6a",
    hpLo: "#7a2408",
    st: "#3d8ff0",
    stHi: "#9ccbff",
    stLo: "#1c4a8a",
    stTag: "#7ab8ff",
    center: "#6ec8ff",
    centerBad: "#ff7a3a",
    boss: "#ff7a3a"
  }, {
    mate: "#e0a0ff",
    ally: "#c890ff"
  } ];
  SX.CB_NAMES = [ "끔", "적록 색약", "청황 색약" ];
  SX.cbc = function(k, def, a) {
    const P = SX.CB_PAL[(SX.opts && SX.opts.cb) | 0], c = P && P[k];
    if (!c) return def;
    if (a == null) return c;
    const n = parseInt(c.slice(1), 16), rgb = (n >> 16) + "," + (n >> 8 & 255) + "," + (n & 255);
    return a === "rgb" ? "rgb(" + rgb + ")" : "rgba(" + rgb + "," + a + ")";
  };
  const CSS_K = {
    ok: "--ok",
    bad: "--bad",
    warn: "--warn",
    hp: "--hp",
    hpHi: "--hpHi",
    hpLo: "--hpLo",
    st: "--st",
    stHi: "--stHi",
    stLo: "--stLo",
    stTag: "--stTag",
    center: "--center",
    centerBad: "--centerBad",
    mate: "--mate"
  };
  SX.applyPal = function() {
    const P = SX.CB_PAL[(SX.opts && SX.opts.cb) | 0] || {}, st = document.documentElement.style;
    for (const k in CSS_K) {
      if (P[k]) st.setProperty(CSS_K[k], P[k]); else st.removeProperty(CSS_K[k]);
    }
    document.body && document.body.classList.toggle("cbOn", !!((SX.opts && SX.opts.cb) | 0));
  };
  const AC = SX.access = {
    list: [],
    LIFE: 1300,
    MIN: .03,
    MAX: 10
  };
  const TYPE = {
    pistol: "gun",
    revolver: "gun",
    smg: "gun",
    rifle: "gun",
    lmg: "gun",
    sniper: "gun",
    shotgun: "gun",
    homemade: "gun",
    suppressed: "gun",
    enemyGun: "gun",
    step: "step",
    explode: "boom",
    flashbang: "boom",
    gasPop: "boom",
    doorOpen: "door",
    doorClose: "door",
    doorBash: "door",
    dogBark: "dog",
    dogGrowl: "dog",
    groan: "zomb",
    shout: "voice"
  };
  AC.TYPE = TYPE;
  AC.mode = () => {
    const v = SX.opts && SX.opts.sndVis;
    return v === true || v === "on" ? "on" : v === "off" ? "off" : "night";
  };
  AC.dark = function() {
    const G = SX.game, env = G && G.env || {}, p = SX.actors && SX.actors.player, F = G && G.floorObj ? G.floorObj() : null;
    if (!p || !F || env.hub) return false;
    const tx = Math.floor(p.x), ty = Math.floor(p.y);
    if (!F.in(tx, ty)) return !!env.night;
    const i = F.i(tx, ty), w = F.win ? F.win[i] || 0 : 0;
    const lum = F.inside && F.inside[i] ? (F.park ? .11 : env.night ? .05 + w * .1 : .3 + w * .55) * (env.dim || 1) : env.night ? .24 : .92;
    return lum < .35;
  };
  AC.live = () => {
    const m = AC.mode();
    return m === "on" || m === "night" && AC.dark();
  };
  function seen(x, y, ty) {
    const V = SX.view, G = SX.game, p = SX.actors.player, F = G.floorObj && G.floorObj();
    if (!V || !F || !SX.light) return false;
    const cam = V.cam, sx = x * TS - cam.x, sy = y * TS - cam.y;
    if (sx < 0 || sy < 0 || sx > V.vw || sy > V.vh) return false;
    if (!SX.light.seenActor(F, x, y)) return false;
    if (ty === "gun" || ty === "boom") return true;
    return SX.light.brightAt(cam, x, y - .4) > .16 || Math.hypot(x - p.x, y - p.y) < (SX.light.NEAR || 2.4);
  }
  AC.seen = seen;
  AC.heard = function(name, o, sp, pr) {
    if (!AC.live()) return;
    const ty = TYPE[name];
    if (!ty || o.amb) return;
    if (ty === "step" && !o.kind && !o.foe) return;
    const G = SX.game, p = SX.actors && SX.actors.player;
    if (!G || G.state !== "raid" || !p || !p.alive) return;
    if (o.f != null && o.f !== p.floor) return;
    const loud = sp.vol * (o.vol == null ? 1 : o.vol) * (pr ? pr.k : 1);
    if (!(loud >= AC.MIN)) return;
    if (seen(o.x, o.y, ty)) return;
    const now = performance.now(), a = Math.atan2(o.y - p.y, o.x - p.x);
    for (const m of AC.list) {
      if (m.ty !== ty || now - m.at > AC.LIFE) continue;
      if (Math.abs(SX.angDiff(Math.atan2(m.y - p.y, m.x - p.x), a)) > .35) continue;
      m.x = o.x;
      m.y = o.y;
      m.at = now;
      m.loud = Math.max(loud, m.loud * .7);
      m.n++;
      return;
    }
    AC.list.push({
      ty,
      x: o.x,
      y: o.y,
      loud,
      at: now,
      n: 1
    });
    if (AC.list.length > AC.MAX) AC.list.shift();
  };
  AC.clear = () => {
    AC.list.length = 0;
  };
  const ICON = {
    gun: [ "........", "#######.", "########", "###.#...", "##......", "##......" ],
    step: [ ".##.....", "####....", "####....", ".##..##.", "....####", ".##.####", ".##..##.", ".....##." ],
    boom: [ "#..#..#", ".#.#.#.", "..###..", "#######", "..###..", ".#.#.#.", "#..#..#" ],
    door: [ "######", "#....#", "#....#", "#..#.#", "#....#", "#....#", "######" ],
    dog: [ "#..#..#", "#..#..#", ".......", ".#####.", "#######", "#######", ".##.##." ],
    zomb: [ ".#####.", "#######", "#..#..#", "#######", ".#####.", ".#.#.#." ],
    voice: [ "#######", "#..#..#", "#..#..#", "#.....#", "#..#..#", "#######", ".##...." ]
  };
  AC.ICON = ICON;
  const PXS = 3;
  function bitmap(ctx, rows, x, y, col) {
    ctx.fillStyle = col;
    for (let r = 0; r < rows.length; r++) for (let c = 0; c < rows[r].length; c++) if (rows[r][c] === "#") ctx.fillRect(x + c * PXS, y + r * PXS, PXS, PXS);
  }
  function icon(ctx, ty, cx, cy) {
    const rows = ICON[ty], w = rows[0].length * PXS, h = rows.length * PXS, x = Math.round(cx - w / 2), y = Math.round(cy - h / 2);
    for (const [dx, dy] of [ [ -1, 0 ], [ 1, 0 ], [ 0, -1 ], [ 0, 1 ] ]) bitmap(ctx, rows, x + dx, y + dy, "#000");
    bitmap(ctx, rows, x, y, ty === "gun" || ty === "boom" ? SX.cbc("warn", "#f0b451") : "#f2efe4");
  }
  const HUD_IDS = [ "hudBars", "hudMapBox", "hudInfo", "hudWeapon", "hudQuick", "hudLog", "hudCourse" ];
  function hudBoxes() {
    const ks = (window.devicePixelRatio || 1) / (SX.view && SX.view.scale || 2), out = [];
    for (const id of HUD_IDS) {
      const el = document.getElementById(id);
      if (!el || el.classList.contains("hidden")) continue;
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) out.push([ r.left * ks - 20, r.top * ks - 20, r.right * ks + 20, r.bottom * ks + 20 ]);
    }
    return out;
  }
  AC.hudBoxes = hudBoxes;
  AC.spot = function(vw, vh, px, py, a, boxes) {
    const dx = Math.cos(a), dy = Math.sin(a), L = 40, Rr = vw - 40, T = 40, B = vh - 52;
    const cx = (L + Rr) / 2, cy = (T + B) / 2, rx = (Rr - L) / 2, ry = (B - T) / 2;
    const ox = px - cx, oy = py - cy, qa = dx * dx / (rx * rx) + dy * dy / (ry * ry), qb = 2 * (ox * dx / (rx * rx) + oy * dy / (ry * ry)), qc = ox * ox / (rx * rx) + oy * oy / (ry * ry) - 1;
    let t = qc < 0 ? (-qb + Math.sqrt(qb * qb - 4 * qa * qc)) / (2 * qa) : 70;
    let x = px + dx * t, y = py + dy * t;
    const tMin = Math.max(40, t * .72);
    for (let k = 0; k < 40 && boxes && boxes.some(b => x > b[0] && x < b[2] && y > b[1] && y < b[3]); k++) {
      t = Math.max(tMin, t - 8);
      x = px + dx * t;
      y = py + dy * t;
      if (t <= tMin) break;
    }
    const inB = (u, v) => boxes && boxes.find(b => u > b[0] && u < b[2] && v > b[1] && v < b[3]), hb = inB(x, y);
    if (hb) {
      let best = null, bd = 1e9;
      for (const [u, v] of [ [ hb[0] - 1, y ], [ hb[2] + 1, y ], [ x, hb[1] - 1 ], [ x, hb[3] + 1 ] ]) {
        if (u < L || u > Rr || v < T || v > B || inB(u, v)) continue;
        const d = Math.abs(u - x) + Math.abs(v - y);
        if (d < bd) {
          bd = d;
          best = [ u, v ];
        }
      }
      if (best) {
        x = best[0];
        y = best[1];
      }
    }
    return [ Math.round(x), Math.round(y) ];
  };
  AC.draw = function(ctx, vw, vh, cam) {
    if (!AC.list.length || AC.mode() === "off") return;
    const p = SX.actors.player;
    if (!p) return;
    const now = performance.now(), boxes = hudBoxes();
    const px = p.x * TS - cam.x, py = (p.y - .5) * TS - cam.y;
    ctx.save();
    for (let i = AC.list.length - 1; i >= 0; i--) {
      const m = AC.list[i], age = now - m.at;
      if (age > AC.LIFE) {
        AC.list.splice(i, 1);
        continue;
      }
      const fade = (age < 80 ? age / 80 : 1) * (1 - Math.pow(age / AC.LIFE, 2));
      const k = Math.min(1, m.loud / .35), a = Math.atan2(m.y - p.y, m.x - p.x), [x, y] = AC.spot(vw, vh, px, py, a, boxes);
      ctx.globalAlpha = Math.max(0, fade) * (.55 + .45 * k);
      ctx.fillStyle = "rgba(8,10,14,0.62)";
      ctx.fillRect(x - 16, y - 13, 32, 26);
      ctx.fillRect(x - 13, y - 16, 26, 32);
      icon(ctx, m.ty, x, y);
      const waves = m.loud > .35 ? 3 : m.loud > .12 ? 2 : 1, wc = m.ty === "gun" || m.ty === "boom" ? SX.cbc("warn", "#f0b451") : "#f2efe4";
      for (let w = 0; w < waves; w++) {
        const r = 22 + w * 6;
        for (let q = -3; q <= 3; q++) {
          const b = a + q * .15, qx = Math.round(x + Math.cos(b) * r), qy = Math.round(y + Math.sin(b) * r);
          ctx.fillStyle = "#000";
          ctx.fillRect(qx - 2, qy - 2, 5, 5);
          ctx.fillStyle = wc;
          ctx.fillRect(qx - 1, qy - 1, 3, 3);
        }
      }
    }
    ctx.restore();
  };
})(window.SX);
