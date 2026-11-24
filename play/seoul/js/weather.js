"use strict";

(function(SX) {
  const W = SX.wx = {
    rng: null,
    said: {},
    rattleT: 9
  };
  const T = SX.map.T;
  W.KINDS = {
    clear: {
      name: "",
      icon: null
    },
    rain: {
      name: "비",
      icon: "rain",
      col: "#8ab4e8",
      line: "🌧 오늘 날씨: 비 — 빗소리 말고는 평소와 같습니다"
    },
    fog: {
      name: "안개",
      icon: "fog",
      col: "#c8ccd2",
      line: "🌫 오늘 날씨: 안개 — 나도 적도 멀리 못 봅니다 · 소리는 그대로 들립니다"
    },
    storm: {
      name: "폭풍",
      icon: "storm",
      col: "#9ab8ff",
      line: "⛈ 오늘 날씨: 폭풍 — 바람에 발소리 · 총소리가 묻힙니다(나도 적도)"
    }
  };
  W.DESC = {
    rain: "비가 옵니다 — 빗소리 말고는 평소와 같습니다",
    fog: "멀리 안 보입니다 — 나도 적도 보는 거리가 짧아집니다(바깥 · 옥상 · 창가가 짙고 건물 안 깊은 곳은 옅습니다). 소리는 그대로입니다",
    storm: "세찬 비바람 — 발소리(바깥 60% · 건물 안 75% 거리) · 총소리(바깥 75% · 안 85%)가 바람에 묻힙니다. 번개가 잦고 칠 때 바깥 · 창가에서는 눈이 부십니다. 바깥 · 옥상에선 총이 조금 흔들리고 집라인은 거는 데 오래 걸립니다"
  };
  W.force = null;
  W.pick = function(seed, b) {
    const r = new SX.Rng((seed >>> 0 ^ 795582001) >>> 0), u = r.f(), amt = r.f();
    let k = W.force && W.KINDS[W.force] ? W.force : u < .3 ? "clear" : u < .62 ? "rain" : u < .82 ? "fog" : "storm";
    if (b && (b.train || b.outdoor === "tunnel")) {
      if (k === "fog") k = "clear"; else if (k === "storm") k = "rain";
    }
    return {
      kind: k,
      rain: k === "rain" ? .45 + amt * .55 : k === "storm" ? 1 : 0
    };
  };
  W.setup = function(env, seed, b) {
    const w = W.pick(seed, b);
    env.wx = w.kind;
    env.rain = w.rain;
    env.fog = w.kind === "fog" ? 1 : 0;
    env.storm = w.kind === "storm" ? 1 : 0;
    W.rng = new SX.Rng((seed >>> 0 ^ 1374496755) >>> 0);
    W.said = {};
    W.rattleT = 6 + W.rng.f() * 8;
    W.gustT = 4;
    env.thunderT = env.storm ? 3 + W.rng.f() * 6 : 8 + W.rng.f() * 20;
    return w;
  };
  const env = () => SX.game && SX.game.env || {};
  W.kind = e => (e || env()).wx || "clear";
  W.label = e => {
    const k = W.KINDS[W.kind(e)];
    return k && k.name ? " · " + k.name : "";
  };
  W.announce = function(e) {
    const k = W.KINDS[W.kind(e)];
    if (k && k.line) SX.log(k.line, W.kind(e) === "rain" ? "" : "warn");
  };
  W.fogAt = function(F, x, y) {
    const e = env();
    if (!e.fog || !F) return 0;
    const tx = Math.floor(x), ty = Math.floor(y);
    if (!F.in(tx, ty)) return 1;
    const i = ty * F.W + tx;
    if (F.kind === "roof" || !F.inside[i]) return 1;
    return Math.min(1, .3 + .7 * (F.win[i] || 0));
  };
  W.fogR = k => 26 - 15.5 * k;
  W.sightMul = function(F, ax, ay, bx, by) {
    const e = env();
    if (!e.fog) return 1;
    return 1 - .55 * Math.max(W.fogAt(F, ax, ay), W.fogAt(F, bx, by));
  };
  W.hides = function(F, P, x, y) {
    const e = env();
    if (!e.fog || !P) return false;
    const k = Math.max(W.fogAt(F, P.x, P.y), W.fogAt(F, x, y));
    return Math.hypot(x - P.x, y - P.y) > W.fogR(k) * .9;
  };
  W.STEP_OUT = .6;
  W.STEP_IN = .75;
  W.stepMul = function(F, x, y) {
    const e = env();
    if (!e.storm || !F) return 1;
    const tx = Math.floor(x), ty = Math.floor(y), i = F.in(tx, ty) ? ty * F.W + tx : -1;
    return F.kind === "roof" || i < 0 || !F.inside[i] ? W.STEP_OUT : W.STEP_IN;
  };
  W.SHOT_OUT = .75;
  W.SHOT_IN = .85;
  W.shotMul = function(F, x, y) {
    const e = env();
    if (!e.storm || !F) return 1;
    const tx = Math.floor(x), ty = Math.floor(y), i = F.in(tx, ty) ? ty * F.W + tx : -1;
    return F.kind === "roof" || i < 0 || !F.inside[i] ? W.SHOT_OUT : W.SHOT_IN;
  };
  W.AIM_OUT = .025;
  W.aimPenalty = function() {
    const e = env();
    if (!e.storm) return 0;
    const p = SX.actors.player, F = SX.game && SX.game.floorObj ? SX.game.floorObj() : null;
    if (!p || !F) return 0;
    const tx = Math.floor(p.x), ty = Math.floor(p.y), i = F.in(tx, ty) ? ty * F.W + tx : -1;
    return F.kind === "roof" || i < 0 || !F.inside[i] ? W.AIM_OUT : 0;
  };
  W.holdMul = function(kind) {
    if (!(env().storm && kind === "zip")) return 1;
    if (!W.said.zip) {
      W.said.zip = true;
      SX.log("바람이 세서 집라인을 거는 데 오래 걸립니다(7초)", "warn");
    }
    return 1.4;
  };
  W.openAt = function(F, x, y) {
    if (!F) return false;
    const tx = Math.floor(x), ty = Math.floor(y);
    if (!F.in(tx, ty)) return true;
    const i = ty * F.W + tx;
    return F.kind === "roof" || !F.inside[i] || (F.win[i] || 0) > .4;
  };
  W.flashOut = (F, x, y) => env().flashT > .05 && W.openAt(F, x, y);
  W.tick = function(dt, F, p) {
    const e = env(), rng = W.rng || SX.rnd;
    if (e.storm || e.rain > .6) {
      e.thunderT -= dt;
      if (e.thunderT <= 0) {
        e.thunderT = e.storm ? 5 + rng.f() * 8 : 15 + rng.f() * 30;
        e.flashT = e.storm ? .45 : .35;
        SX.audio.play("thunder", {
          delay: (e.storm ? .2 : .4) + rng.f() * (e.storm ? .8 : 1.2),
          vol: e.storm ? 1 : .8
        });
        strike(F, p, e);
      }
    }
    e.flashT = Math.max(0, (e.flashT || 0) - dt);
    if (e.storm && F && p && p.alive) {
      rattle(dt, F, p);
      gusts(dt, F, p);
    }
  };
  function strike(F, p, e) {
    if (!p || !p.alive || !F || p.floor !== F.idx || SX.game && SX.game.god || !SX.tac) return;
    const TC = SX.tac, open = W.openAt(F, p.x, p.y), nv = SX.nvg && SX.nvg.on(p);
    let t = 0;
    if (nv) t = open ? 2 : .9; else if (e.storm && open) t = .45;
    if (t > TC.blindT) {
      TC.blindT = t;
      if (nv && !W.said.nv) {
        W.said.nv = true;
        SX.log("⚡ 번개 — 투시경 화면이 하얗게 탔습니다", "bad");
      } else if (!nv && !W.said.flash) {
        W.said.flash = true;
        SX.log("⚡ 번개가 번쩍여 잠깐 눈이 부십니다");
      }
    }
  }
  function rattle(dt, F, p) {
    W.rattleT -= dt;
    if (W.rattleT > 0) return;
    W.rattleT = 6 + SX.rnd.f() * 9;
    const px = Math.floor(p.x), py = Math.floor(p.y);
    let best = null, bd = 1e9;
    for (let y = py - 6; y <= py + 6; y++) for (let x = px - 6; x <= px + 6; x++) {
      if (!F.in(x, y) || F.t[y * F.W + x] !== T.WINDOW) continue;
      const d = Math.hypot(x + .5 - p.x, y + .5 - p.y);
      if (d < bd) {
        bd = d;
        best = [ x + .5, y + .5 ];
      }
    }
    if (best) SX.audio.play("winRattle", {
      x: best[0],
      y: best[1],
      range: 14,
      vol: .6
    });
  }
  function gusts(dt, F, p) {
    W.gustT = (W.gustT == null ? 4 : W.gustT) - dt;
    if (W.gustT > 0) return;
    W.gustT = 7 + Math.random() * 10;
    SX.audio.play("gust", {
      vol: W.openAt(F, p.x, p.y) ? .85 : .45,
      r: .92 + Math.random() * .12
    });
  }
  let hz = null, hctx = null, hImg = null, wisp = null, wctx = null;
  const HALF = SX.TS / 2, WK = 8;
  W.draw = function(ctx, cam, vw, vh, F, e, now, P) {
    if (!e || !e.fog || e.hub || !F || !P) return;
    const cx0 = Math.floor(cam.x / HALF) - 1, cy0 = Math.floor(cam.y / HALF) - 1, cw = Math.ceil(vw / HALF) + 3, ch = Math.ceil(vh / HALF) + 3;
    if (!hz || hz.width !== cw || hz.height !== ch) {
      hz = SX.art.mk(cw, ch);
      hctx = hz.getContext("2d");
      hImg = hctx.createImageData(cw, ch);
    }
    const nv = !!e.nv, col = !e.night ? [ 178, 184, 190 ] : nv ? [ 96, 104, 100 ] : [ 30, 36, 42 ], D = hImg.data;
    const kP = W.fogAt(F, P.x, P.y), ex = P.x, ey = P.y - .4;
    for (let cy = 0; cy < ch; cy++) {
      const wy = (cy0 + cy + .5) / 2;
      for (let cx = 0; cx < cw; cx++) {
        const wx = (cx0 + cx + .5) / 2, o = (cy * cw + cx) * 4;
        const k = Math.max(kP, W.fogAt(F, wx, wy)), R1 = W.fogR(k), R0 = R1 * .5;
        let f = (Math.hypot(wx - ex, wy - ey) - R0) / (R1 - R0);
        f = f <= 0 ? 0 : f >= 1 ? 1 : f * f * (3 - 2 * f);
        D[o] = col[0];
        D[o + 1] = col[1];
        D[o + 2] = col[2];
        D[o + 3] = Math.round(f * .9 * 255);
      }
    }
    hctx.putImageData(hImg, 0, 0);
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(hz, cx0 * HALF - cam.x, cy0 * HALF - cam.y, cw * HALF, ch * HALF);
    ctx.imageSmoothingEnabled = false;
    const w = Math.ceil(vw / WK) + 4, h = Math.ceil(vh / WK) + 4;
    if (!wisp) {
      wisp = SX.art.mk(w, h);
      wctx = wisp.getContext("2d");
    }
    if (wisp.width !== w || wisp.height !== h) {
      wisp.width = w;
      wisp.height = h;
    }
    wctx.clearRect(0, 0, w, h);
    wctx.globalCompositeOperation = "lighter";
    const sx = Math.floor(cam.x / WK), sy = Math.floor(cam.y / WK), t = now;
    for (let k = 0; k < 18; k++) {
      const sp = 1.2 + k % 4 * .7, r = 5 + k % 5 * 2.4;
      const x = ((k * 57.3 + t * sp - sx) % (w + 30) + (w + 30)) % (w + 30) - 15;
      const y = ((k * 37.1 + Math.sin(t * .15 + k) * 3 - sy) % (h + 20) + (h + 20)) % (h + 20) - 10;
      const g = wctx.createRadialGradient(x, y, 0, x, y, r), a = .22 + k % 3 * .06;
      g.addColorStop(0, "rgba(" + col.join(",") + "," + a + ")");
      g.addColorStop(1, "rgba(" + col.join(",") + ",0)");
      wctx.fillStyle = g;
      wctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    wctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = .25 + .45 * kP;
    ctx.drawImage(wisp, 0, 0, w, h, -WK * 2 - (cam.x - sx * WK), -WK * 2 - (cam.y - sy * WK), w * WK, h * WK);
    ctx.restore();
  };
})(window.SX);
