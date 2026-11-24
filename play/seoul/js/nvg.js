"use strict";

(function(SX) {
  const NV = SX.nvg = {
    glare: 0,
    said: {}
  };
  const A = SX.actors, L = SX.light;
  NV.NAME = "야간 투시경";
  NV.FLIP = .4;
  NV.BAT_T = 480;
  NV.FLASH_R = 1.35;
  NV.FLASH_T = 1.7;
  NV.FLASH_AWAY = .6;
  NV.worn = p => !!(p && p.kit && p.kit.nvg);
  NV.on = p => NV.worn(p) && !!p.nvOn;
  NV.bat = p => {
    const it = NV.worn(p) ? p.kit.nvg : null;
    return !it ? 0 : it.bat == null ? 100 : Math.max(0, Math.min(100, +it.bat || 0));
  };
  NV.recharge = kit => {
    if (kit && kit.nvg) kit.nvg.bat = 100;
  };
  NV.reset = () => {
    NV.said = {};
    NV.glare = 0;
    NV.day = null;
  };
  NV.state = a => !a ? 0 : a === A.player ? NV.worn(a) ? a.nvOn ? 2 : 1 : 0 : a.nv | 0;
  NV.toggle = function(p) {
    if (!p || !p.alive) return false;
    if (!NV.worn(p)) {
      SX.log("야간 투시경을 장착 창의 「투시경」 칸에 쓰셔야 켤 수 있습니다", "warn");
      SX.audio.play("denied");
      return false;
    }
    if (p.use) {
      SX.audio.play("denied");
      return false;
    }
    if (!p.nvOn && NV.bat(p) <= 0) {
      SX.log("🔋 투시경 전지가 다 됐습니다 — 셸터로 돌아가면 충전됩니다", "warn");
      SX.audio.play("denied");
      return false;
    }
    p.nvOn = !p.nvOn;
    p.nvT = NV.FLIP;
    p.cool = Math.max(p.cool || 0, NV.FLIP);
    SX.audio.play("nvgFlip", {
      on: p.nvOn
    });
    const G = SX.game;
    if (p.nvOn && !NV.said.on) {
      NV.said.on = true;
      SX.log("🟢 야간 투시경을 켰습니다 — 어둠이 밝아지지만 섬광탄 · 번개 · 총구 불빛 · 손전등에 더 눈이 부십니다");
    }
    if (p.nvOn && G.env && !G.env.night && !NV.said.day) {
      NV.said.day = true;
      SX.log("낮에는 투시경이 눈부셔 오히려 잘 안 보입니다", "warn");
    }
    if (p.nvOn && p.torch && !NV.said.torch) {
      NV.said.torch = true;
      SX.log("손전등을 켠 채면 투시경 화면이 하얗게 번집니다 — [" + SX.label("light") + "] 로 끄시면 됩니다");
    }
    if (SX.ui) SX.ui.hudDirty();
    return true;
  };
  NV.update = function(dt, ctl, F) {
    const p = A.player, G = SX.game, In = SX.input;
    if (p && ctl && In.pressed("nvg")) NV.toggle(p);
    if (p && !NV.worn(p)) p.nvOn = false;
    if (p && p.nvT > 0) p.nvT = Math.max(0, p.nvT - dt);
    if (SX.coop && SX.coop.ghosts) for (const g of SX.coop.ghosts.values()) if (g.nvT > 0) g.nvT = Math.max(0, g.nvT - dt);
    let on = !!(p && p.alive && NV.on(p) && G.state === "raid");
    if (on) {
      const it = p.kit.nvg, b = NV.bat(p) - dt * 100 / NV.BAT_T;
      it.bat = Math.max(0, b);
      if (b <= 25 && !NV.said.low) {
        NV.said.low = true;
        SX.log("🔋 투시경 전지가 얼마 안 남았습니다(2분)", "warn");
        if (SX.ui) SX.ui.hudDirty();
      }
      if (b <= 0) {
        p.nvOn = false;
        p.nvT = NV.FLIP;
        on = false;
        SX.log("🔋 투시경 전지가 다 됐습니다 — 저절로 꺼집니다. 셸터로 돌아가면 충전됩니다", "bad");
        SX.audio.play("nvgFlip", {
          on: false
        });
        if (SX.ui) SX.ui.hudDirty();
      }
    }
    if (G.env) G.env.nv = on;
    if (!on) {
      NV.glare = 0;
      NV.day = null;
      return;
    }
    const tx = Math.floor(p.x), ty = Math.floor(p.y), ti = F && F.in(tx, ty) ? ty * F.W + tx : -1;
    const out = !F || ti < 0 || F.kind === "roof" || !F.inside[ti], win = !out && F.win ? Math.min(1, F.win[ti] || 0) : 0;
    const day = G.env && !G.env.night ? out ? .55 : .25 + .1 * win : 0;
    NV.day = NV.day == null ? day : NV.day + Math.max(-dt * .6, Math.min(dt * .6, day - NV.day));
    let base = NV.day;
    if (p.torch) base = Math.max(base, .3);
    let g = Math.max(base, NV.glare - dt * 2.5);
    if (F) {
      for (const l of L.dyn) {
        if (l.floor !== F.idx) continue;
        const d = Math.hypot(l.x - p.x, l.y - p.y);
        if (d > 16 || !L.seen(F, l.x, l.y)) continue;
        const s = Math.min(1, l.r / 5) * (l.a == null ? 1 : Math.min(1.5, l.a)) * (l.t / l.life);
        g = Math.max(g, Math.min(.85, s * (1 - d / 16) * .75));
      }
      if (SX.coop && SX.coop.torches) for (const q of SX.coop.torches(F.idx)) {
        const dx = p.x - q.x, dy = p.y - .4 - q.y, d = Math.hypot(dx, dy);
        if (d > 12 || d < .3) continue;
        if ((dx * Math.cos(q.a) + dy * Math.sin(q.a)) / d > Math.cos(.5) && L.los(F, q.x, q.y, p.x, p.y - .4)) g = Math.max(g, .6 * (1 - d / 12));
      }
    }
    NV.glare = g;
  };
  let grain = null, vig = null, vigK = "";
  function grainCv() {
    if (grain) return grain;
    grain = SX.art.mk(97, 89);
    const x = grain.getContext("2d"), im = x.createImageData(97, 89), d = im.data;
    for (let i = 0; i < 97 * 89; i++) {
      if (Math.random() < .28) {
        const v = 120 + Math.random() * 135 | 0;
        d[i * 4] = v * .7;
        d[i * 4 + 1] = v;
        d[i * 4 + 2] = v * .7;
        d[i * 4 + 3] = 255;
      }
    }
    x.putImageData(im, 0, 0);
    return grain;
  }
  function vigCv(vw, vh) {
    const w = Math.ceil(vw / 4), h = Math.ceil(vh / 4), k = w + "x" + h;
    if (vig && vigK === k) return vig;
    vig = SX.art.mk(w, h);
    vigK = k;
    const x = vig.getContext("2d"), im = x.createImageData(w, h), d = im.data;
    for (let y = 0; y < h; y++) for (let i = 0; i < w; i++) {
      const r = Math.hypot((i + .5 - w / 2) / (w * .5), (y + .5 - h / 2) / (h * .62));
      let a = (r - .72) / .42;
      a = a <= 0 ? 0 : a >= 1 ? 1 : a;
      a = Math.round(a * 5) / 5;
      const o = (y * w + i) * 4;
      d[o] = 2;
      d[o + 1] = 8;
      d[o + 2] = 4;
      d[o + 3] = Math.round(a * .94 * 255);
    }
    x.putImageData(im, 0, 0);
    return vig;
  }
  NV.post = function(ctx, vw, vh, now, P, e) {
    if (!e || !e.nv) return;
    ctx.save();
    ctx.globalCompositeOperation = "color";
    ctx.fillStyle = "#46ff6e";
    ctx.fillRect(0, 0, vw, vh);
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = "#0c2e12";
    ctx.fillRect(0, 0, vw, vh);
    const gc = grainCv(), ox = Math.random() * 97 | 0, oy = Math.random() * 89 | 0;
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = .09;
    ctx.translate(-ox, -oy);
    ctx.fillStyle = ctx.createPattern(gc, "repeat");
    ctx.fillRect(ox, oy, vw, vh);
    ctx.translate(ox, oy);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = .07;
    ctx.fillStyle = "#000";
    for (let y = (now * 24 | 0) % 3; y < vh; y += 3) ctx.fillRect(0, y, vw, 1);
    ctx.globalAlpha = 1;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(vigCv(vw, vh), 0, 0, Math.ceil(vw / 4) * 4, Math.ceil(vh / 4) * 4);
    if (NV.glare > .01) {
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = Math.min(.9, NV.glare);
      ctx.fillStyle = "#dcffdc";
      ctx.fillRect(0, 0, vw, vh);
    }
    ctx.restore();
  };
  const specs = new WeakMap;
  NV.spec = function(spec, st) {
    if (!spec || !st) return spec;
    let v = specs.get(spec);
    if (!v) {
      v = [];
      specs.set(spec, v);
    }
    return v[st] || (v[st] = Object.assign({}, spec, {
      key: (spec.key || "x") + ":nv" + st,
      nvg: st
    }));
  };
  NV.specOf = a => {
    const st = NV.state(a);
    return st ? NV.spec(a.spec, st) : a.spec;
  };
  NV.hands = function(dir, a) {
    const k = 1 - Math.max(0, a.nvT || 0) / NV.FLIP, on = NV.state(a) === 2, y = Math.round(on ? -37 + 6 * k : -31 - 6 * k);
    return dir === 1 ? {
      n: [ 6, y ],
      f: null
    } : dir === 3 ? {
      n: [ -7, y ],
      f: null
    } : dir === 2 ? {
      n: [ 4, y - 1 ],
      f: null
    } : {
      n: [ -4, y ],
      f: null
    };
  };
  NV.netApply = function(g, v) {
    const st = v === 1 || v === 2 ? v : 0;
    if (g.nv | 0 && st && (g.nv | 0) !== st) {
      g.nvT = NV.FLIP;
      const p = A.player;
      if (p && p.floor === g.floor) SX.audio.play("nvgFlip", {
        on: st === 2,
        x: g.x,
        y: g.y,
        range: 8,
        vol: .7
      });
    }
    g.nv = st;
  };
})(window.SX);
