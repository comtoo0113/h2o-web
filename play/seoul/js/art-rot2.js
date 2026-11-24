"use strict";

(function(SX) {
  const A = SX.art, RP = A.ramp, mix = A.mix, sh = A.shade, PP = A.PP, R2 = A.ROT;
  const {box, sbox, vgrad, grain, vgrain, grime, post, cut, rivet, scratch, rgba, rust, glass, goods, txt, word, screen, drip, crack} = PP;
  const {build, plinth, feet, molding, hseams, planks, doorSeam, cord, vents, hinge, knob, tileWall, glassBox} = R2;
  function drawers(P, F, n, o) {
    o = o || {};
    const R = F.R, top = o.top || 2, bot = o.bot || 3, hh = F.h - top - bot;
    if (hh < n * 3) return;
    for (let k = 0; k < n; k++) {
      const y = F.y + top + Math.round(k * hh / n), h = Math.round(hh / n) - 1, x = F.x + 2, w = F.w - 4;
      if (w < 4 || h < 2) continue;
      P.r(x, y, w, h, R[3]).r(x, y, w, 1, R[4]).r(x, y + h - 1, w, 1, R[1]).r(x, y, 1, h, R[4]).r(x + w - 1, y, 1, h, R[1]);
      const hw = Math.max(2, Math.min(8, Math.round(w * .3))), hx = x + Math.round((w - hw) / 2), hy = y + Math.max(1, Math.round(h / 2) - 1);
      P.r(hx, hy, hw, 1, o.handle || "#c8a040").p(hx, hy, o.hl || "#f0d070");
    }
  }
  function sidePanel(P, F, o) {
    o = o || {};
    const R = F.R, top = o.top == null ? 2 : o.top, bot = o.bot == null ? 4 : o.bot;
    if (F.w < 4 || F.h < top + bot + 2) return;
    P.r(F.x + 1, F.y + top, F.w - 2, F.h - top - bot, R[3]);
    vgrad(P, F.x + 1, F.y + top, F.w - 2, F.h - top - bot, R[4], R[2], .25, .95);
    P.r(F.x + 1, F.y + top, F.w - 2, 1, R[4]).r(F.x + 1, F.y + top, 1, F.h - top - bot, R[4]).r(F.x + F.w - 2, F.y + top, 1, F.h - top - bot, R[1]);
    if (bot >= 2) P.r(F.x, F.y + F.h - bot, F.w, bot, R[1]).r(F.x, F.y + F.h - bot, F.w, 1, R[2]);
  }
  function edgeLines(P, F) {
    const R = F.R;
    P.r(F.x, F.y, F.w, 1, R[5]).r(F.x, F.y + F.h - 1, F.w, 1, R[0]);
  }
  function disc(P, cx, cy, rx, ry, c1, c2) {
    P.oval(cx, cy, rx, ry, c1);
    if (c2 && rx > 1 && ry > 1) P.oval(cx, cy, rx - 1, ry - 1, c2);
  }
  const topRim = (P, T) => {
    if (T.h > 0) P.r(T.x, T.y, T.w, 1, T.R[5]);
  };
  const WHITE = "#dcdcd4", STEEL = "#b8c0c4";
  build("bathtub", {
    front: true,
    pad: 2,
    tpu: 16,
    sh: .4,
    col: WHITE,
    parts: [ {
      x: 0,
      y: .04,
      w: 1,
      d: .96,
      z: 0,
      hh: 16,
      boxo: {
        fi: 3
      },
      f: (P, F, g) => {
        const R = F.R;
        P.r(F.x + 2, F.y + 2, F.w - 4, F.h - 6, R[3]);
        vgrad(P, F.x + 2, F.y + 2, F.w - 4, F.h - 6, R[4], R[2], .2, .95);
        P.r(F.x + 2, F.y + 2, F.w - 4, 1, R[5]).r(F.x + 2, F.y + F.h - 5, F.w - 4, 1, R[1]);
        P.r(F.x + 1, F.y + F.h - 3, F.w - 2, 3, R[1]).r(F.x + 1, F.y + F.h - 3, F.w - 2, 1, R[2]);
        grime(P, F.x + 3, F.y + F.h - 8, F.w - 6, 5, g, 5, "rgba(120,110,60,0.18)");
      },
      s: (P, F, g) => {
        const R = F.R;
        P.r(F.x + 2, F.y + 2, F.w - 4, F.h - 6, R[3]);
        vgrad(P, F.x + 2, F.y + 2, F.w - 4, F.h - 6, R[4], R[2], .2, .95);
        P.r(F.x + 1, F.y + F.h - 3, F.w - 2, 3, R[1]);
        grime(P, F.x + 2, F.y + F.h - 7, F.w - 4, 4, g, 3, "rgba(120,110,60,0.18)");
      },
      b: (P, F, g) => {
        const R = F.R;
        P.r(F.x + 2, F.y + 2, F.w - 4, F.h - 5, R[2]);
        P.r(F.x + 1, F.y + F.h - 3, F.w - 2, 3, R[1]);
        P.r(F.x + Math.round(F.w * .86), F.y + 3, 3, F.h - 6, "#8a9298");
      },
      t: (P, T, g) => {
        const R = T.R;
        P.r(T.x, T.y, T.w, T.h, R[5]);
        P.r(T.x, T.y, T.w, 1, "#f4f4ee");
        const inn = T.put(.05, .14, .9, .72), wat = T.put(.08, .26, .84, .54);
        if (inn.w > 4 && inn.h > 3) {
          P.r(inn.x, inn.y, inn.w, inn.h, R[2]);
          P.r(inn.x, inn.y, inn.w, 1, R[1]);
          P.r(inn.x, inn.y + inn.h - 1, inn.w, 1, R[4]);
        }
        if (wat.w > 3 && wat.h > 2) {
          const wc = T.v % 2 ? "#6a9ab0" : "#7aa8b8";
          P.r(wat.x, wat.y, wat.w, wat.h, wc);
          P.r(wat.x, wat.y, wat.w, 1, "#a8d0e0").r(wat.x, wat.y + wat.h - 1, wat.w, 1, "#4a7a90");
          for (let k = 0; k < 5; k++) P.p(wat.x + 1 + g.i(Math.max(1, wat.w - 2)), wat.y + 1 + g.i(Math.max(1, wat.h - 2)), "#d8f0f8");
        }
        const dr = T.put(.12, .46, .04, .08);
        P.r(dr.x, dr.y, Math.max(2, dr.w), Math.max(1, dr.h), "#5a6268");
        grime(P, T.x + 1, T.y + 1, T.w - 2, Math.max(1, T.h - 2), g, 4, "rgba(120,110,60,0.14)");
      }
    }, {
      x: .88,
      y: .1,
      w: .05,
      d: .16,
      z: 16,
      hh: 6,
      col: STEEL,
      metal: 1,
      all: (P, F) => {
        P.r(F.x, F.y, F.w, 1, "#e8f0f4");
      }
    }, {
      x: .8,
      y: .08,
      w: .04,
      d: .08,
      z: 16,
      hh: 2,
      col: "#c84040",
      nohit: 1
    }, {
      x: .95,
      y: .08,
      w: .04,
      d: .08,
      z: 16,
      hh: 2,
      col: "#4060c0",
      nohit: 1
    }, {
      x: .04,
      y: .02,
      w: .16,
      d: .18,
      z: 12,
      hh: 7,
      col: "#e8d8a0",
      nohit: 1,
      cond: v => v % 3 === 1,
      all: (P, F) => {
        const R = F.R;
        P.r(F.x, F.y, F.w, 1, R[5]);
        P.r(F.x, F.y + F.h - 1, F.w, 1, R[2]);
      }
    } ]
  });
  function showerGlass(P, F, g, o) {
    o = o || {};
    const M = RP("#9aa2a8");
    const x = F.x + 2, y = F.y + 2, w = Math.max(1, F.w - 4), hh = Math.max(1, F.h - 4);
    tileWall(P, {
      x,
      y,
      w,
      h: hh
    }, g);
    if (o.head) {
      const hx = o.headX != null ? o.headX : x + Math.round(w * .6);
      P.r(hx, y + 2, 2, 10, STEEL).r(hx - 4, y + 2, 6, 3, STEEL).r(hx - 4, y + 2, 6, 1, "#e8f0f4");
      for (let k = 0; k < 4; k++) P.p(hx - 4 + k * 2, y + 6 + k % 2, "#cfe8f0");
    }
    P.r(x, y, w, hh, rgba("#bfe0f0", .22));
    P.line(x + 2, y + hh - 4, x + Math.round(w * .5), y + 4, "rgba(255,255,255,0.45)").line(x + 5, y + hh - 2, x + Math.round(w * .75), y + 6, "rgba(255,255,255,0.22)");
    for (let k = 0; k < 5; k++) {
      const dx = x + 1 + g.i(Math.max(1, w - 2)), dy = y + Math.round(hh * .4) + g.i(Math.max(1, Math.round(hh * .5)));
      P.r(dx, dy, 1, 2 + g.i(3), "rgba(230,245,255,0.35)");
    }
    P.r(F.x, F.y, F.w, 2, M[4]).r(F.x, F.y, 2, F.h, M[4]).r(F.x + F.w - 2, F.y, 2, F.h, M[2]).r(F.x, F.y + F.h - 2, F.w, 2, M[3]);
    if (o.handle) P.r(F.x + F.w - 6, F.y + Math.round(F.h * .4), 2, 10, "#e8f0f4").r(F.x + F.w - 6, F.y + Math.round(F.h * .4), 1, 10, "#ffffff");
  }
  build("shower", {
    front: true,
    pad: 3,
    tpu: 16,
    sh: .38,
    col: "#c8c8c0",
    parts: [ {
      x: 0,
      y: 0,
      w: 1,
      d: 1,
      z: 0,
      hh: 5,
      boxo: {
        fi: 3
      },
      all: (P, F) => {
        const R = F.R;
        P.r(F.x, F.y, F.w, 1, R[5]);
        P.r(F.x, F.y + F.h - 1, F.w, 1, R[1]);
      },
      t: (P, T) => {
        P.r(T.x + 2, T.y + 1, T.w - 4, Math.max(1, T.h - 2), "#a8b0b4");
        const d = T.put(.44, .44, .12, .12);
        P.r(d.x, d.y, Math.max(2, d.w), Math.max(1, d.h), "#4a5258");
      }
    }, {
      x: 0,
      y: 0,
      w: 1,
      d: 1,
      z: 5,
      hh: 56,
      col: "#9aa2a8",
      skipBox: true,
      f: (P, F, g) => showerGlass(P, F, g, {
        head: true,
        handle: true
      }),
      s: (P, F, g) => {
        showerGlass(P, F, g, {
          head: true,
          headX: F.x + 5
        });
        if (F.v % 2 === 0) {
          P.r(F.x + Math.round(F.w * .55), F.y - 1, 8, 16, "#e8d8a0").r(F.x + Math.round(F.w * .55), F.y - 1, 8, 2, "#f8ecc0").r(F.x + Math.round(F.w * .55), F.y + 14, 8, 1, "#b8a870");
        }
      },
      b: (P, F, g) => {
        const R = RP("#b8b8b0");
        P.r(F.x, F.y, F.w, F.h, R[3]);
        vgrad(P, F.x, F.y, F.w, F.h, R[4], R[2], .2, .95);
        P.r(F.x, F.y, F.w, 2, "#9aa2a8").r(F.x, F.y, 2, F.h, "#9aa2a8").r(F.x + F.w - 2, F.y, 2, F.h, "#7a8288");
        P.r(F.x + Math.round(F.w * .4), F.y + 6, 2, F.h - 10, "#8a9298").r(F.x + Math.round(F.w * .4) + 4, F.y + 6, 2, F.h - 10, "#8a9298");
      },
      t: (P, T) => {
        const M = RP("#9aa2a8");
        P.r(T.x, T.y, T.w, T.h, "#6a7278");
        P.r(T.x + 2, T.y + 2, Math.max(1, T.w - 4), Math.max(1, T.h - 4), rgba("#bfe0f0", .25));
        P.r(T.x, T.y, T.w, 2, M[4]).r(T.x, T.y, 2, T.h, M[4]).r(T.x + T.w - 2, T.y, 2, T.h, M[2]).r(T.x, T.y + T.h - 2, T.w, 2, M[3]);
      }
    } ]
  });
  build("washer", {
    front: true,
    pad: 4,
    tpu: 12,
    col: (c, v) => c || (v % 2 ? "#d8d8d0" : "#c8ccd4"),
    parts: [ {
      x: 0,
      y: .04,
      w: 1,
      d: .96,
      z: 0,
      hh: 36,
      boxo: {
        fi: 3
      },
      f: (P, F, g) => {
        const R = F.R;
        P.r(F.x + 1, F.y + 1, F.w - 2, 7, R[1]).r(F.x + 1, F.y + 8, F.w - 2, 1, R[0]);
        P.r(F.x + 3, F.y + 3, 6, 3, "#2a3038").p(F.x + 4, F.y + 4, "#4ae06a");
        disc(P, F.x + F.w - 7, F.y + 4, 2, 2, "#3a3e44", "#8a9098");
        P.r(F.x + 11, F.y + 3, 3, 3, "#4a8ad0").p(F.x + 12, F.y + 4, "#8ad0ff");
        const cx = F.x + Math.round(F.w / 2), cy = F.y + 10 + Math.round((F.h - 14) / 2), r = Math.max(3, Math.min(Math.round((F.w - 6) / 2), Math.round((F.h - 14) / 2)));
        disc(P, cx, cy, r + 1, r + 1, R[0]);
        disc(P, cx, cy, r, r, "#8a9098", "#3a4048");
        disc(P, cx, cy, r - 2, r - 2, "#1e2228");
        if (F.v % 3 === 1) {
          disc(P, cx + 1, cy + 1, Math.max(1, r - 4), Math.max(1, r - 5), "#4a6a8a");
          P.oval(cx - 1, cy, 2, 1, "#e8e8e0");
        }
        P.oval(cx - Math.round(r / 2), cy - Math.round(r / 2), 2, 1, "rgba(255,255,255,0.3)");
        P.r(F.x + 1, F.y + F.h - 4, F.w - 2, 3, R[1]);
      },
      s: (P, F, g) => {
        const R = F.R;
        P.r(F.x + 1, F.y + 8, F.w - 2, 1, R[1]);
        for (let y = F.y + F.h - 9; y < F.y + F.h - 4; y += 2) P.r(F.x + 3, y, F.w - 6, 1, R[1]);
        P.r(F.x + 1, F.y + F.h - 3, F.w - 2, 2, R[1]);
        scratch(P, F.x + 2, F.y + 10, F.w - 4, F.h - 16, g, 3, R[5]);
      },
      b: (P, F, g) => {
        const R = F.R;
        P.r(F.x + 3, F.y + 3, F.w - 6, F.h - 7, R[2]);
        for (const [dx, c] of [ [ .3, "#3a4048" ], [ .6, "#6a8aa8" ] ]) {
          const x = F.x + Math.round(F.w * dx);
          P.r(x, F.y + 6, 2, F.h - 8, c);
          P.r(x - 1, F.y + 5, 4, 2, c);
        }
        cord(P, F.x + F.w - 6, F.y + 8, F.h - 10);
      },
      t: (P, T, g) => {
        const R = T.R;
        P.r(T.x + 1, T.y + 1, T.w - 2, 1, R[5]);
        const dt = T.put(.06, .08, .36, .3);
        P.r(dt.x, dt.y, dt.w, dt.h, R[2]).r(dt.x, dt.y, dt.w, 1, R[1]);
        if (T.v % 2) {
          const tw = T.put(.5, .35, .4, .45);
          P.r(tw.x, tw.y, tw.w, tw.h, "#e8d8a0").r(tw.x, tw.y, tw.w, 1, "#f8ecc0");
        }
        grime(P, T.x + 2, T.y + 2, T.w - 4, Math.max(1, T.h - 3), g, 3);
      }
    } ]
  });
  build("cupboard", {
    front: true,
    pad: 2,
    tpu: 12,
    col: "#a07850",
    parts: [ {
      x: 0,
      y: .08,
      w: 1,
      d: .92,
      z: 0,
      hh: 24,
      wood: 1,
      all: (P, F) => plinth(P, F, {
        h: 3
      }),
      f: (P, F, g) => {
        const R = F.R;
        P.r(F.x + 2, F.y + 2, F.w - 4, 5, R[2]).r(F.x + 2, F.y + 2, F.w - 4, 1, R[4]);
        for (const t of [ .25, .75 ]) P.r(F.x + Math.round(F.w * t) - 3, F.y + 4, 6, 1, "#c8a040");
        doorSeam(P, {
          x: F.x,
          y: F.y + 7,
          w: F.w,
          h: F.h - 7,
          R
        }, 2, {
          top: 1,
          bot: 4
        });
        knob(P, F.x + Math.round(F.w / 2) - 4, F.y + 12, 3);
        knob(P, F.x + Math.round(F.w / 2) + 2, F.y + 12, 3);
      },
      s: (P, F) => sidePanel(P, F, {
        bot: 3
      }),
      b: (P, F) => planks(P, F, 5),
      t: (P, T, g) => {
        const R = T.R;
        topRim(P, T);
        const jar = T.put(.08, .62, .08, .25), bowl = T.put(.78, .6, .14, .28);
        if (jar.w > 1 && jar.h > 1) P.r(jar.x, jar.y, jar.w, jar.h, "#c8a878").r(jar.x, jar.y, jar.w, 1, "#e8c898");
        if (bowl.w > 2 && bowl.h > 1) P.r(bowl.x, bowl.y, bowl.w, bowl.h, "#e8e4d8").r(bowl.x + 1, bowl.y, Math.max(1, bowl.w - 2), 1, "#8a5a2a");
      }
    }, {
      x: .02,
      y: 0,
      w: .96,
      d: .44,
      z: 24,
      hh: 34,
      wood: 1,
      all: (P, F) => {
        const R = F.R;
        P.r(F.x - 1, F.y, F.w + 2, 3, R[4]).r(F.x - 1, F.y, F.w + 2, 1, R[5]).r(F.x - 1, F.y + 2, F.w + 2, 1, R[1]);
      },
      f: (P, F, g) => {
        const R = F.R, n = F.w > 36 ? 2 : 1;
        for (let k = 0; k < n; k++) {
          const x = F.x + 2 + Math.round(k * (F.w - 4) / n), w = Math.round((F.w - 4) / n) - 1, y = F.y + 4, hh = F.h - 6;
          P.r(x, y, w, hh, R[1]);
          glass(P, x + 1, y + 1, w - 2, hh - 2, {});
          for (let s = 0; s < 3; s++) {
            const yy = y + 9 + s * 9;
            if (yy > y + hh - 2) break;
            P.r(x + 1, yy, w - 2, 1, R[4]);
            for (let j = 0; j + 5 < w - 2; j += 7) P.r(x + 3 + j, yy - 4, 5, 4, g.pick([ "#e8e4d8", "#c8d8e8", "#e8c8a8" ])).r(x + 3 + j, yy - 4, 5, 1, "#ffffff");
          }
          P.r(x + 1, y + 1, w - 2, 1, "rgba(255,255,255,0.35)");
          P.r(x + (k ? 2 : w - 4), y + Math.round(hh / 2), 2, 3, "#c8a040");
        }
      },
      s: (P, F, g) => {
        const R = F.R;
        sidePanel(P, F, {
          top: 4,
          bot: 1
        });
        const w = Math.max(2, F.w - 6);
        P.r(F.x + 3, F.y + 8, w, F.h - 14, R[1]);
        glass(P, F.x + 4, F.y + 9, Math.max(1, w - 2), F.h - 16, {});
      },
      b: (P, F) => planks(P, F, 5),
      t: topRim
    } ]
  });
  build("diningTable", {
    front: true,
    pad: 2,
    tpu: 16,
    sh: .34,
    col: "#a07850",
    parts: [ {
      x: .03,
      y: .06,
      w: .06,
      d: .12,
      z: 0,
      hh: 19,
      noTop: 1,
      col: c => sh(c, -.38)
    }, {
      x: .91,
      y: .06,
      w: .06,
      d: .12,
      z: 0,
      hh: 19,
      noTop: 1,
      col: c => sh(c, -.38)
    }, {
      x: .03,
      y: .82,
      w: .06,
      d: .12,
      z: 0,
      hh: 19,
      noTop: 1,
      col: c => sh(c, -.3)
    }, {
      x: .91,
      y: .82,
      w: .06,
      d: .12,
      z: 0,
      hh: 19,
      noTop: 1,
      col: c => sh(c, -.3)
    }, {
      x: .05,
      y: .08,
      w: .9,
      d: .84,
      z: 15,
      hh: 4,
      noTop: 1,
      col: c => sh(c, -.2)
    }, {
      x: 0,
      y: 0,
      w: 1,
      d: 1,
      z: 19,
      hh: 3,
      wood: 1,
      all: (P, F) => edgeLines(P, F),
      t: (P, T, g) => {
        grain(P, T.x + 1, T.y + 1, T.w - 2, Math.max(1, T.h - 2), T.col, g, Math.round(T.w * T.h / 20));
        for (const u of [ .16, .5, .84 ]) for (const vv of [ .18, .66 ]) {
          if (u === .5) continue;
          const q = T.put(u - .08, vv, .16, .22);
          if (q.w < 3 || q.h < 2) continue;
          P.oval(q.x + Math.round(q.w / 2), q.y + Math.round(q.h / 2), Math.max(1, Math.round(q.w / 2)), Math.max(1, Math.round(q.h / 2)), "#f4f2ea");
          P.oval(q.x + Math.round(q.w / 2), q.y + Math.round(q.h / 2), Math.max(1, Math.round(q.w / 2) - 1), Math.max(1, Math.round(q.h / 2) - 1), "#d8d4c8");
          if (T.v % 2) P.p(q.x + Math.round(q.w / 2), q.y + Math.round(q.h / 2), g.pick([ "#c84a3a", "#e0b040", "#5aa05a" ]));
        }
        for (const [u, vv] of [ [ .3, .3 ], [ .66, .62 ] ]) {
          const c = T.put(u, vv, .04, .1);
          P.r(c.x, c.y, Math.max(2, c.w), Math.max(2, c.h), "#a8c8d8").r(c.x, c.y, Math.max(2, c.w), 1, "#e8f4f8");
        }
      }
    }, {
      x: .47,
      y: .42,
      w: .06,
      d: .14,
      z: 22,
      hh: 8,
      col: "#4a8ab0",
      nohit: 1,
      all: (P, F) => {
        const R = F.R;
        P.r(F.x, F.y, 1, F.h, R[5]);
      },
      t: (P, T) => {
        P.r(T.x - 1, T.y - 3, T.w + 2, 3, "#5aa05a");
        P.p(T.x, T.y - 4, "#e84a6a").p(T.x + T.w - 1, T.y - 3, "#f0d040");
      }
    } ]
  });
  build("prepCounter", {
    front: true,
    pad: 2,
    tpu: 13,
    col: "#6a5a4a",
    parts: [ {
      x: .01,
      y: .1,
      w: .98,
      d: .88,
      z: 0,
      hh: 3,
      noTop: 1,
      col: "#2a2622"
    }, {
      x: 0,
      y: .06,
      w: 1,
      d: .94,
      z: 3,
      hh: 14,
      noTop: 1,
      wood: 1,
      f: (P, F) => {
        const R = F.R;
        P.r(F.x + 2, F.y + 1, F.w - 4, 3, R[2]).r(F.x + 2, F.y + 1, F.w - 4, 1, R[4]);
        for (const t of [ .25, .75 ]) P.r(F.x + Math.round(F.w * t) - 3, F.y + 2, 6, 1, "#c8a040");
        doorSeam(P, {
          x: F.x,
          y: F.y + 4,
          w: F.w,
          h: F.h - 4,
          R
        }, 2, {
          top: 1,
          bot: 1
        });
      },
      s: (P, F) => sidePanel(P, F, {
        top: 1,
        bot: 1
      }),
      b: (P, F) => planks(P, F, 4)
    }, {
      x: 0,
      y: 0,
      w: 1,
      d: 1,
      z: 17,
      hh: 3,
      col: "#b8b4a8",
      metal: 1,
      all: (P, F) => edgeLines(P, F),
      t: (P, T, g) => {
        const Rt = T.R;
        P.noise(T.x + 1, T.y + 1, T.w - 2, Math.max(1, T.h - 2), [ Rt[3], Rt[5] ], .1, g);
        const bd = T.put(.08, .32, .32, .5);
        P.r(bd.x, bd.y, bd.w, bd.h, "#c8a878").r(bd.x, bd.y, bd.w, 1, "#e8c898").r(bd.x, bd.y + bd.h - 1, bd.w, 1, "#8a6a48");
        const kn = T.put(.14, .36, .2, .05);
        P.r(kn.x, kn.y, kn.w, Math.max(1, kn.h), "#c8ccd0");
        const hd = T.put(.1, .35, .05, .07);
        P.r(hd.x, hd.y, Math.max(1, hd.w), Math.max(1, hd.h), "#3a2a1e");
        for (const [u, vv, c] of [ [ .44, .5, "#c84a3a" ], [ .5, .62, "#5aa05a" ], [ .56, .46, "#e0b040" ], [ .6, .66, "#e08040" ] ]) {
          const q = T.put(u, vv, .04, .12);
          P.r(q.x, q.y, Math.max(2, q.w), Math.max(2, q.h), c);
        }
      }
    }, {
      x: 0,
      y: 0,
      w: 1,
      d: .05,
      z: 20,
      hh: 9,
      col: "#d8d8d0",
      nohit: 1,
      f: (P, F, g) => tileWall(P, F, g),
      b: (P, F) => {
        const R = F.R;
        P.r(F.x, F.y, F.w, F.h, R[2]);
      }
    }, {
      x: .72,
      y: .26,
      w: .14,
      d: .4,
      z: 20,
      hh: 6,
      col: "#9aa2a8",
      metal: 1,
      nohit: 1,
      all: (P, F) => {
        P.r(F.x, F.y, F.w, 1, "#c8d0d4");
        P.r(F.x + F.w, F.y + 1, 2, 1, "#5a5e64");
      },
      t: (P, T) => {
        P.r(T.x + 1, T.y + 1, Math.max(1, T.w - 2), Math.max(1, T.h - 2), "#4a4e54");
      }
    } ]
  });
  build("microwave", {
    front: true,
    pad: 3,
    tpu: 12,
    col: "#c8ccd0",
    parts: [ {
      x: .04,
      y: .08,
      w: .92,
      d: .9,
      z: 0,
      hh: 20,
      col: "#8a8074",
      wood: 1,
      all: (P, F) => plinth(P, F, {
        h: 2
      }),
      f: (P, F) => {
        const R = F.R;
        P.r(F.x + 2, F.y + 2, F.w - 4, 5, R[2]).r(F.x + 2, F.y + 2, F.w - 4, 1, R[4]).r(F.x + Math.round(F.w / 2) - 2, F.y + 4, 4, 1, "#c8a040");
        doorSeam(P, {
          x: F.x,
          y: F.y + 7,
          w: F.w,
          h: F.h - 7,
          R
        }, 1, {
          top: 1,
          bot: 3
        });
        knob(P, F.x + F.w - 7, F.y + 10, 3);
      },
      s: (P, F) => sidePanel(P, F, {
        bot: 2
      }),
      b: (P, F) => planks(P, F, 2),
      t: topRim
    }, {
      x: .06,
      y: .14,
      w: .88,
      d: .7,
      z: 20,
      hh: 15,
      metal: 1,
      boxo: {
        fi: 3
      },
      f: (P, F, g) => {
        const R = F.R, ww = Math.round(F.w * .62);
        P.r(F.x + 2, F.y + 2, ww, F.h - 4, "#1e2228").r(F.x + 3, F.y + 3, ww - 2, F.h - 6, F.v % 2 ? "#3a3020" : "#24282e");
        if (F.v % 2) {
          P.oval(F.x + 2 + Math.round(ww / 2), F.y + Math.round(F.h / 2) + 1, 4, 2, "#e0b040");
          P.oval(F.x + 2 + Math.round(ww / 2), F.y + Math.round(F.h / 2), 3, 1, "#f8e0a0");
        }
        P.line(F.x + 3, F.y + F.h - 4, F.x + 3 + Math.round(ww * .5), F.y + 3, "rgba(255,255,255,0.14)");
        const px = F.x + ww + 4;
        P.r(px, F.y + 2, F.w - ww - 6, F.h - 4, R[1]);
        P.r(px + 1, F.y + 3, Math.max(1, F.w - ww - 8), 2, "#4ae06a");
        for (let j = 0; j < 3; j++) P.r(px + 1, F.y + 7 + j * 2, Math.max(1, F.w - ww - 8), 1, R[4]);
      },
      s: (P, F) => {
        const R = F.R;
        for (let y = F.y + 3; y < F.y + F.h - 3; y += 2) P.r(F.x + 2, y, Math.max(1, F.w - 5), 1, R[1]);
      },
      b: (P, F) => {
        const R = F.R;
        P.r(F.x + 2, F.y + 2, F.w - 4, F.h - 4, R[2]);
        for (let y = F.y + 4; y < F.y + F.h - 3; y += 2) P.r(F.x + 4, y, F.w - 8, 1, R[1]);
        cord(P, F.x + F.w - 5, F.y + F.h - 3, 6);
      },
      t: (P, T, g) => {
        topRim(P, T);
        grime(P, T.x + 2, T.y + 1, T.w - 4, Math.max(1, T.h - 2), g, 3);
      }
    }, {
      x: .2,
      y: .3,
      w: .36,
      d: .36,
      z: 35,
      hh: 6,
      col: "#e8e4d8",
      nohit: 1,
      cond: v => v % 3 === 2,
      all: (P, F) => {
        P.r(F.x, F.y, F.w, 1, "#f8f4e8");
      },
      t: (P, T) => {
        P.r(T.x + Math.round(T.w / 2) - 1, T.y, 2, Math.max(1, T.h), "#c84a3a");
      }
    } ]
  });
  build("waterCooler", {
    front: true,
    pad: 6,
    tpu: 14,
    col: "#d8dce0",
    parts: [ {
      x: .08,
      y: .14,
      w: .84,
      d: .74,
      z: 0,
      hh: 12,
      boxo: {
        fi: 3
      },
      f: (P, F) => {
        const R = F.R;
        P.r(F.x + 2, F.y + 2, F.w - 4, 6, R[1]).r(F.x + 3, F.y + 3, 3, 2, "#c84040").r(F.x + F.w - 6, F.y + 3, 3, 2, "#4060c0");
        P.r(F.x + 3, F.y + 5, 2, 2, STEEL).r(F.x + F.w - 5, F.y + 5, 2, 2, STEEL);
        P.r(F.x + 2, F.y + 8, F.w - 4, 2, "#3a4048").r(F.x + 2, F.y + 10, F.w - 4, 1, R[0]);
      },
      s: (P, F) => {
        const R = F.R;
        P.r(F.x + 1, F.y + 6, F.w - 2, 1, R[1]);
        for (let y = F.y + F.h - 9; y < F.y + F.h - 3; y += 2) P.r(F.x + 2, y, F.w - 4, 1, R[1]);
      },
      b: (P, F) => {
        const R = F.R;
        P.r(F.x + 2, F.y + 3, F.w - 4, F.h - 7, "#4a4e54");
        for (let y = F.y + 5; y < F.y + F.h - 5; y += 2) P.r(F.x + 3, y, F.w - 6, 1, "#6a6e74");
        cord(P, F.x + F.w - 5, F.y + F.h - 4, 4);
      },
      t: topRim
    }, {
      x: .3,
      y: .32,
      w: .4,
      d: .36,
      z: 12,
      hh: 2,
      col: "#5a8ab0"
    }, {
      x: .2,
      y: .24,
      w: .6,
      d: .52,
      z: 14,
      hh: 8,
      col: "#7ab0d8",
      skipBox: true,
      nohit: 1,
      all: (P, F) => {
        const x = F.x, y = F.y, w = F.w, hh = F.h;
        P.r(x, y + 2, w, hh - 2, "#7ab0d8");
        vgrad(P, x, y + 2, w, hh - 2, "#a8d0f0", "#5a90c0", .1, .95);
        P.r(x + 1, y, w - 2, 2, "#8ac0e8");
        P.r(x, y + Math.round(hh * .3), w, 1, "#4a80a8");
        P.r(x + 1, y + 3, 2, hh - 6, "rgba(255,255,255,0.35)");
        P.r(x + w - 1, y + 2, 1, hh - 2, "#4a80a8");
      },
      t: (P, T) => {
        P.oval(T.x + Math.round(T.w / 2), T.y + Math.round(T.h / 2), Math.max(1, Math.round(T.w / 2)), Math.max(1, Math.round(T.h / 2)), "#9ac8e8");
      }
    } ]
  });
  const BED_WOOD = "#8a6a40";
  function blanketTop(P, T, g, col) {
    const R = RP(col);
    P.r(T.x, T.y, T.w, T.h, R[3]);
    vgrad(P, T.x, T.y, T.w, T.h, R[4], R[2], .1, .9);
    const lip = T.put(0, 0, 1, .12);
    P.r(lip.x, lip.y, lip.w, lip.h, "#ecebe4");
    P.r(lip.x, lip.y, lip.w, 1, "#f8f8f2");
    const along = T.h >= T.w;
    for (let k = 0; k < 4; k++) {
      const wx = T.x + 2 + g.i(Math.max(2, T.w - 4)), wy = T.y + 4 + g.i(Math.max(2, T.h - 6));
      if (along) P.line(wx, wy, wx + 3 + g.i(5), wy + 2, R[2]); else P.line(wx, wy, wx + 2, wy + 3 + g.i(5), R[2]);
    }
  }
  function pillow(P, T) {
    P.r(T.x, T.y, T.w, T.h, "#f4f4ee");
    P.r(T.x, T.y, T.w, 1, "#ffffff").r(T.x, T.y + T.h - 1, T.w, 1, "#c8c8c0");
    if (T.w > 6 && T.h > 4) P.r(T.x + 2, T.y + Math.round(T.h / 2), T.w - 4, 1, "#dcdcd4");
  }
  build("singleBed", {
    front: true,
    pad: 2,
    tpu: 26,
    sh: .42,
    col: "#5a6a8a",
    parts: [ {
      x: .04,
      y: .02,
      w: .1,
      d: .05,
      z: 0,
      hh: 5,
      noTop: 1,
      col: sh(BED_WOOD, -.3)
    }, {
      x: .86,
      y: .02,
      w: .1,
      d: .05,
      z: 0,
      hh: 5,
      noTop: 1,
      col: sh(BED_WOOD, -.3)
    }, {
      x: .04,
      y: .92,
      w: .1,
      d: .06,
      z: 0,
      hh: 5,
      noTop: 1,
      col: sh(BED_WOOD, -.3)
    }, {
      x: .86,
      y: .92,
      w: .1,
      d: .06,
      z: 0,
      hh: 5,
      noTop: 1,
      col: sh(BED_WOOD, -.3)
    }, {
      x: .02,
      y: .02,
      w: .96,
      d: .96,
      z: 4,
      hh: 5,
      noTop: 1,
      col: BED_WOOD,
      wood: 1
    }, {
      x: .05,
      y: .06,
      w: .9,
      d: .88,
      z: 9,
      hh: 5,
      col: "#e8e6dc",
      all: (P, F) => {
        P.r(F.x, F.y, F.w, 1, "#f4f2ea");
        P.r(F.x, F.y + F.h - 1, F.w, 1, "#b8b6ae");
      },
      t: (P, T) => {
        P.r(T.x, T.y, T.w, T.h, "#e8e6dc");
      }
    }, {
      x: .14,
      y: .08,
      w: .72,
      d: .18,
      z: 14,
      hh: 3,
      col: "#f4f4ee",
      nohit: 1,
      t: (P, T) => pillow(P, T),
      all: (P, F) => {
        P.r(F.x, F.y, F.w, F.h, "#dcdcd4");
      }
    }, {
      x: .04,
      y: .36,
      w: .92,
      d: .58,
      z: 14,
      hh: 2,
      col: c => c,
      nohit: 1,
      all: (P, F, g, col) => {
        const R = RP(col);
        P.r(F.x, F.y, F.w, F.h, R[2]);
        P.r(F.x, F.y, F.w, 1, R[4]);
      },
      t: (P, T, g, col) => blanketTop(P, T, g, col)
    }, {
      x: .02,
      y: 0,
      w: .96,
      d: .06,
      z: 4,
      hh: 24,
      col: BED_WOOD,
      wood: 1,
      f: (P, F) => {
        const R = F.R;
        P.r(F.x + 3, F.y + 3, F.w - 6, F.h - 12, R[2]).r(F.x + 3, F.y + 3, F.w - 6, 1, R[1]).r(F.x + 3, F.y + F.h - 10, F.w - 6, 1, R[4]);
      },
      s: (P, F) => {
        const R = F.R;
        P.r(F.x, F.y, F.w, 2, R[5]);
      },
      b: (P, F) => {
        planks(P, F, 3);
      },
      t: topRim
    }, {
      x: .02,
      y: .94,
      w: .96,
      d: .06,
      z: 4,
      hh: 12,
      col: BED_WOOD,
      wood: 1,
      f: (P, F) => {
        const R = F.R;
        P.r(F.x + 3, F.y + 2, F.w - 6, F.h - 5, R[2]).r(F.x + 3, F.y + 2, F.w - 6, 1, R[1]).r(F.x + 3, F.y + F.h - 4, F.w - 6, 1, R[4]);
      },
      s: (P, F) => {
        const R = F.R;
        P.r(F.x, F.y, F.w, 2, R[5]);
      },
      b: (P, F) => {
        const R = F.R;
        P.r(F.x + 2, F.y + 2, F.w - 4, F.h - 4, R[2]);
      },
      t: topRim
    } ]
  });
  const BUNK = "#5a6068";
  const bunkLevel = (z, col2) => [ {
    x: .04,
    y: .04,
    w: .92,
    d: .92,
    z,
    hh: 3,
    noTop: 1,
    col: BUNK,
    metal: 1
  }, {
    x: .06,
    y: .06,
    w: .88,
    d: .88,
    z: z + 3,
    hh: 4,
    col: "#e8e6dc",
    all: (P, F) => {
      P.r(F.x, F.y, F.w, 1, "#f4f2ea");
    },
    t: (P, T) => {
      P.r(T.x, T.y, T.w, T.h, "#e8e6dc");
    }
  }, {
    x: .14,
    y: .08,
    w: .72,
    d: .16,
    z: z + 7,
    hh: 3,
    col: "#f4f4ee",
    nohit: 1,
    t: (P, T) => pillow(P, T),
    all: (P, F) => {
      P.r(F.x, F.y, F.w, F.h, "#dcdcd4");
    }
  }, {
    x: .05,
    y: .36,
    w: .9,
    d: .56,
    z: z + 7,
    hh: 2,
    col: col2,
    nohit: 1,
    all: (P, F, g, col) => {
      const R = RP(col);
      P.r(F.x, F.y, F.w, F.h, R[2]);
      P.r(F.x, F.y, F.w, 1, R[4]);
    },
    t: (P, T, g, col) => blanketTop(P, T, g, col)
  } ];
  build("bunkBed", {
    front: true,
    pad: 2,
    tpu: 24,
    sh: .44,
    col: "#8a4a3a",
    parts: [ ...bunkLevel(5, c => c), ...bunkLevel(37, c => mix(c, "#e8e0d0", .28)), {
      x: .02,
      y: .02,
      w: .08,
      d: .06,
      z: 0,
      hh: 62,
      col: BUNK,
      metal: 1
    }, {
      x: .9,
      y: .02,
      w: .08,
      d: .06,
      z: 0,
      hh: 62,
      col: BUNK,
      metal: 1
    }, {
      x: .02,
      y: .92,
      w: .08,
      d: .06,
      z: 0,
      hh: 62,
      col: BUNK,
      metal: 1
    }, {
      x: .9,
      y: .92,
      w: .08,
      d: .06,
      z: 0,
      hh: 62,
      col: BUNK,
      metal: 1
    }, {
      x: .1,
      y: .02,
      w: .8,
      d: .03,
      z: 12,
      hh: 6,
      noTop: 1,
      col: BUNK,
      metal: 1,
      nohit: 1
    }, {
      x: .1,
      y: .02,
      w: .8,
      d: .03,
      z: 46,
      hh: 10,
      noTop: 1,
      col: BUNK,
      metal: 1,
      nohit: 1
    }, {
      x: .1,
      y: .95,
      w: .8,
      d: .03,
      z: 44,
      hh: 8,
      noTop: 1,
      col: BUNK,
      metal: 1,
      nohit: 1
    }, {
      x: .02,
      y: .08,
      w: .04,
      d: .5,
      z: 46,
      hh: 6,
      noTop: 1,
      col: BUNK,
      metal: 1,
      nohit: 1
    }, {
      x: .94,
      y: .56,
      w: .05,
      d: .36,
      z: 0,
      hh: 46,
      col: BUNK,
      skipBox: true,
      nohit: 1,
      all: (P, F) => {
        const M = RP(BUNK);
        P.r(F.x, F.y, 2, F.h, M[3]).r(F.x + F.w - 2, F.y, 2, F.h, M[2]);
        for (let y = F.y + 4; y < F.y + F.h - 2; y += 7) P.r(F.x, y, F.w, 2, M[4]).r(F.x, y, F.w, 1, M[5]);
      }
    } ]
  });
  build("nightstand", {
    front: true,
    pad: 5,
    tpu: 12,
    col: "#8a6a40",
    parts: [ {
      x: .02,
      y: .12,
      w: .96,
      d: .8,
      z: 0,
      hh: 20,
      wood: 1,
      all: (P, F) => plinth(P, F, {
        h: 2
      }),
      f: (P, F) => drawers(P, F, 2, {
        top: 2,
        bot: 3
      }),
      s: (P, F) => sidePanel(P, F, {
        bot: 2
      }),
      b: (P, F) => planks(P, F, 2),
      t: topRim
    }, {
      x: .36,
      y: .32,
      w: .22,
      d: .22,
      z: 20,
      hh: 2,
      col: "#3a3a3c",
      nohit: 1
    }, {
      x: .45,
      y: .4,
      w: .05,
      d: .06,
      z: 22,
      hh: 7,
      noTop: 1,
      col: "#3a3a3c",
      nohit: 1
    }, {
      x: .28,
      y: .28,
      w: .38,
      d: .3,
      z: 29,
      hh: 8,
      col: "#e8d8a0",
      nohit: 1,
      all: (P, F) => {
        vgrad(P, F.x, F.y, F.w, F.h, "#f8ecc0", "#c8b070", .1, .95);
        P.r(F.x, F.y + F.h - 1, F.w, 1, "#fff4d0");
      },
      t: (P, T) => {
        P.r(T.x, T.y, T.w, T.h, "#fff0c0");
      }
    }, {
      x: .66,
      y: .48,
      w: .26,
      d: .34,
      z: 20,
      hh: 2,
      col: "#8a3a2a",
      nohit: 1,
      t: (P, T) => {
        P.r(T.x, T.y, T.w, T.h, "#8a3a2a");
        P.r(T.x, T.y, 1, T.h, "#e8e4d8");
      }
    } ]
  });
  build("dresser", {
    front: true,
    pad: 4,
    tpu: 11,
    col: "#8a6a40",
    parts: [ {
      x: 0,
      y: .1,
      w: 1,
      d: .9,
      z: 0,
      hh: 44,
      wood: 1,
      all: (P, F) => {
        plinth(P, F, {
          h: 3
        });
        molding(P, F);
      },
      f: (P, F) => drawers(P, F, 4, {
        top: 4,
        bot: 4
      }),
      s: (P, F) => sidePanel(P, F, {
        top: 4,
        bot: 3
      }),
      b: (P, F) => planks(P, F, 3),
      t: topRim
    }, {
      x: .12,
      y: .3,
      w: .26,
      d: .34,
      z: 44,
      hh: 6,
      col: "#4a5a3a",
      nohit: 1,
      cond: v => v % 2 === 1,
      all: (P, F) => {
        P.r(F.x, F.y, F.w, 1, "#6a7a5a");
      },
      t: (P, T) => {
        P.r(T.x, T.y - 3, T.w, 3, "#5aa05a");
        P.p(T.x + 1, T.y - 4, "#7ac07a").p(T.x + T.w - 2, T.y - 4, "#5aa05a");
      }
    }, {
      x: .52,
      y: .32,
      w: .34,
      d: .34,
      z: 44,
      hh: 4,
      col: "#6a2a3a",
      nohit: 1,
      cond: v => v % 2 === 0,
      all: (P, F) => {
        P.r(F.x, F.y, F.w, 1, "#8a4a5a");
        P.p(F.x + Math.round(F.w / 2), F.y + 2, "#c8a040");
      }
    } ]
  });
  build("vanity", {
    front: true,
    pad: 3,
    tpu: 12,
    col: "#c8b090",
    parts: [ {
      x: 0,
      y: .24,
      w: .3,
      d: .76,
      z: 0,
      hh: 18,
      noTop: 1,
      wood: 1,
      all: (P, F) => plinth(P, F, {
        h: 2
      }),
      f: (P, F) => drawers(P, F, 2, {
        top: 1,
        bot: 2
      }),
      s: (P, F) => sidePanel(P, F, {
        top: 1,
        bot: 2
      }),
      b: (P, F) => planks(P, F, 2)
    }, {
      x: .7,
      y: .24,
      w: .3,
      d: .76,
      z: 0,
      hh: 18,
      noTop: 1,
      wood: 1,
      all: (P, F) => plinth(P, F, {
        h: 2
      }),
      f: (P, F) => drawers(P, F, 2, {
        top: 1,
        bot: 2
      }),
      s: (P, F) => sidePanel(P, F, {
        top: 1,
        bot: 2
      }),
      b: (P, F) => planks(P, F, 2)
    }, {
      x: .3,
      y: .26,
      w: .4,
      d: .06,
      z: 12,
      hh: 6,
      noTop: 1,
      wood: 1,
      nohit: 1,
      f: (P, F) => drawers(P, F, 1, {
        top: 1,
        bot: 1
      })
    }, {
      x: 0,
      y: .2,
      w: 1,
      d: .8,
      z: 18,
      hh: 3,
      wood: 1,
      all: (P, F) => edgeLines(P, F),
      t: (P, T, g) => {
        grain(P, T.x + 1, T.y + 1, T.w - 2, Math.max(1, T.h - 2), T.col, g, Math.round(T.w * T.h / 22));
      }
    }, {
      x: .2,
      y: .2,
      w: .6,
      d: .06,
      z: 21,
      hh: 30,
      skipBox: true,
      nohit: 1,
      base: (P, F, g, col) => {
        const R = RP(col);
        P.r(F.x, F.y, F.w, F.h, R[3]);
        P.r(F.x, F.y, F.w, 1, R[5]).r(F.x, F.y, 1, F.h, R[4]).r(F.x + F.w - 1, F.y, 1, F.h, R[1]);
      },
      f: (P, F, g, col) => {
        if (F.w < 6) return;
        vgrad(P, F.x + 2, F.y + 2, F.w - 4, F.h - 4, "#a8b8c0", "#5a6a74", 0, 1);
        P.r(F.x + 3, F.y + 3, Math.round(F.w * .3), Math.round(F.h * .25), "rgba(255,255,255,0.12)");
        P.line(F.x + 4, F.y + F.h - 4, F.x + Math.round(F.w * .6), F.y + 3, "rgba(255,255,255,0.35)");
      },
      s: (P, F, g, col) => {
        const R = RP(col);
        P.r(F.x, F.y + 1, F.w, F.h - 2, R[2]);
        P.r(F.x + F.w - 1, F.y + 1, 1, F.h - 2, "rgba(200,220,240,0.6)");
      },
      b: (P, F, g, col) => {
        const R = RP(col);
        if (F.w > 6) P.r(F.x + 2, F.y + 2, F.w - 4, F.h - 4, R[1]);
      }
    }, {
      x: .58,
      y: .5,
      w: .04,
      d: .1,
      z: 21,
      hh: 6,
      col: "#f0a0c0",
      nohit: 1
    }, {
      x: .64,
      y: .46,
      w: .03,
      d: .08,
      z: 21,
      hh: 5,
      col: "#4a8ad0",
      nohit: 1
    }, {
      x: .69,
      y: .52,
      w: .05,
      d: .1,
      z: 21,
      hh: 3,
      col: "#e8e8e0",
      nohit: 1
    }, {
      x: .26,
      y: .52,
      w: .12,
      d: .2,
      z: 21,
      hh: 2,
      col: "#c8a040",
      nohit: 1
    } ]
  });
  function fanGrille(P, F, back) {
    const cx = F.x + Math.round(F.w / 2), cy = F.y + Math.round(F.h / 2), r = Math.max(3, Math.min(Math.round(F.w / 2), Math.round(F.h / 2)) - 1), W = RP("#d8dce0");
    P.oval(cx, cy, r + 1, r + 1, W[1]).oval(cx, cy, r, r, "#2a2e34");
    if (!back) for (let k = 0; k < 3; k++) {
      const a = k / 3 * Math.PI * 2 + .4;
      P.thick(cx, cy, Math.round(cx + Math.cos(a) * (r - 1)), Math.round(cy + Math.sin(a) * (r - 1)), 2, W[4]);
    } else P.oval(cx, cy, Math.max(1, Math.round(r / 2)), Math.max(1, Math.round(r / 2)), W[2]);
    P.ring(cx, cy, r, r, W[4]);
    for (let a = 0; a < 6.283; a += .7) P.line(cx, cy, Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r), "rgba(216,220,224,0.3)");
    P.oval(cx, cy, 2, 2, W[4]).p(cx - 1, cy - 1, W[5]);
  }
  build("fan", {
    front: true,
    pad: 6,
    tpu: 12,
    sh: .34,
    col: "#d8dce0",
    parts: [ {
      x: .24,
      y: .3,
      w: .52,
      d: .54,
      z: 0,
      hh: 3,
      boxo: {
        fi: 3
      },
      f: (P, F) => {
        P.p(F.x + Math.round(F.w / 2) - 2, F.y + 1, "#4ae06a").p(F.x + Math.round(F.w / 2) + 2, F.y + 1, "#c84040");
      },
      t: (P, T) => {
        P.r(T.x, T.y, T.w, 1, T.R[5]);
      }
    }, {
      x: .46,
      y: .5,
      w: .08,
      d: .08,
      z: 3,
      hh: 18,
      noTop: 1,
      col: "#9aa2a8",
      nohit: 1
    }, {
      x: .38,
      y: .38,
      w: .24,
      d: .16,
      z: 19,
      hh: 12,
      col: "#c8ccd0",
      nohit: 1
    }, {
      x: .12,
      y: .54,
      w: .76,
      d: .1,
      z: 14,
      hh: 24,
      skipBox: true,
      nohit: 1,
      f: (P, F) => fanGrille(P, F, false),
      b: (P, F) => fanGrille(P, F, true),
      s: (P, F) => {
        const W = RP("#d8dce0"), cx = F.x + Math.round(F.w / 2), cy = F.y + Math.round(F.h / 2), rx = Math.max(2, Math.round(F.w / 2)), ry = Math.max(3, Math.round(F.h / 2) - 1);
        P.oval(cx, cy, rx, ry, W[2]).oval(cx, cy, Math.max(1, rx - 1), Math.max(1, ry - 1), "#3a3e44");
        P.r(cx - 1, F.y + 1, 2, F.h - 2, W[4]);
      }
    } ]
  });
  const IRON = "#2e332e";
  build("bench", {
    pad: 3,
    tpu: 12,
    col: (c, v) => c || [ "#8a6a44", "#6a5a44", "#7a5238" ][v % 3],
    parts: [ {
      x: .017,
      y: .15,
      w: .086,
      d: .8,
      z: 0,
      hh: 9,
      col: IRON,
      metal: 1,
      s: (P, F) => {
        const M = RP(IRON);
        P.r(F.x + 2, F.y + 1, F.w - 4, F.h - 3, "rgba(0,0,0,0)");
        P.r(F.x, F.y + F.h - 2, 3, 2, M[1]).r(F.x + F.w - 3, F.y + F.h - 2, 3, 2, M[1]);
        P.thick(F.x + 1, F.y + F.h - 2, F.x + F.w - 2, F.y + 1, 2, M[3]);
      }
    }, {
      x: .897,
      y: .15,
      w: .086,
      d: .8,
      z: 0,
      hh: 9,
      col: IRON,
      metal: 1,
      s: (P, F) => {
        const M = RP(IRON);
        P.r(F.x, F.y + F.h - 2, 3, 2, M[1]).r(F.x + F.w - 3, F.y + F.h - 2, 3, 2, M[1]);
        P.thick(F.x + 1, F.y + F.h - 2, F.x + F.w - 2, F.y + 1, 2, M[3]);
      }
    }, {
      x: .02,
      y: .25,
      w: .96,
      d: .75,
      z: 8,
      hh: 3,
      wood: 1,
      all: (P, F) => edgeLines(P, F),
      t: (P, T, g) => {
        const R = T.R;
        for (const [a, b] of [ [ 0, .3 ], [ .35, .65 ], [ .7, 1 ] ]) {
          const q = T.put(0, a, 1, b - a);
          P.r(q.x, q.y, q.w, q.h, R[4]);
          P.r(q.x, q.y, q.w, 1, R[5]);
        }
      }
    }, {
      x: .1,
      y: .03,
      w: .03,
      d: .06,
      z: 8,
      hh: 22,
      noTop: 1,
      col: IRON,
      metal: 1,
      nohit: 1
    }, {
      x: .87,
      y: .03,
      w: .03,
      d: .06,
      z: 8,
      hh: 22,
      noTop: 1,
      col: IRON,
      metal: 1,
      nohit: 1
    }, {
      x: .03,
      y: .08,
      w: .94,
      d: .08,
      z: 12,
      hh: 15,
      skipBox: true,
      wood: 1,
      nohit: 1,
      all: (P, F, g, col) => {
        const R = RP(col);
        for (let k = 0; k < 3; k++) {
          const y = F.y + k * 5;
          P.r(F.x, y, F.w, 4, R[3]).r(F.x, y, F.w, 1, R[5]).r(F.x, y + 3, F.w, 1, R[1]);
        }
      },
      t: (P, T, g, col) => {
        const R = RP(col);
        P.r(T.x, T.y, T.w, T.h, R[4]);
      }
    }, {
      x: .017,
      y: .2,
      w: .086,
      d: .6,
      z: 18,
      hh: 3,
      col: IRON,
      metal: 1,
      nohit: 1
    }, {
      x: .897,
      y: .2,
      w: .086,
      d: .6,
      z: 18,
      hh: 3,
      col: IRON,
      metal: 1,
      nohit: 1
    } ]
  });
  const HB = "#c8c6bc", HM = "#9aa0a6";
  build("bed", {
    pad: 3,
    tpu: 27,
    sh: .42,
    col: HB,
    parts: [ {
      x: .08,
      y: .04,
      w: .12,
      d: .06,
      z: 0,
      hh: 3,
      noTop: 1,
      col: "#18191c"
    }, {
      x: .8,
      y: .04,
      w: .12,
      d: .06,
      z: 0,
      hh: 3,
      noTop: 1,
      col: "#18191c"
    }, {
      x: .08,
      y: .9,
      w: .12,
      d: .06,
      z: 0,
      hh: 3,
      noTop: 1,
      col: "#18191c"
    }, {
      x: .8,
      y: .9,
      w: .12,
      d: .06,
      z: 0,
      hh: 3,
      noTop: 1,
      col: "#18191c"
    }, {
      x: .04,
      y: .03,
      w: .92,
      d: .94,
      z: 3,
      hh: 6,
      noTop: 1,
      col: HM,
      metal: 1,
      all: (P, F) => {
        const M = RP(HM);
        P.r(F.x, F.y + 1, F.w, 2, M[4]);
      }
    }, {
      x: .06,
      y: .05,
      w: .88,
      d: .9,
      z: 9,
      hh: 6,
      col: "#b9c8b4",
      all: (P, F) => {
        P.r(F.x, F.y, F.w, 1, "#dce8d8");
      },
      t: (P, T) => {
        P.r(T.x, T.y, T.w, T.h, "#c9d6c4");
      }
    }, {
      x: .2,
      y: .07,
      w: .6,
      d: .16,
      z: 15,
      hh: 3,
      col: "#e8e8e0",
      nohit: 1,
      t: (P, T) => pillow(P, T),
      all: (P, F) => {
        P.r(F.x, F.y, F.w, F.h, "#d8d8d0");
      }
    }, {
      x: .06,
      y: .4,
      w: .88,
      d: .54,
      z: 15,
      hh: 2,
      col: "#6a8aa8",
      nohit: 1,
      all: (P, F) => {
        const R = RP("#6a8aa8");
        P.r(F.x, F.y, F.w, F.h, R[2]);
      },
      t: (P, T, g) => blanketTop(P, T, g, [ "#6a8aa8", "#8a9a7a", "#a89a80" ][T.v % 3])
    }, {
      x: .04,
      y: 0,
      w: .92,
      d: .05,
      z: 9,
      hh: 16,
      col: HB,
      boxo: {
        fi: 3
      },
      f: (P, F) => {
        const R = F.R;
        P.r(F.x + 3, F.y + 5, F.w - 6, 1, R[1]).r(F.x + 3, F.y + 9, F.w - 6, 1, R[1]);
      },
      b: (P, F) => {
        const R = F.R;
        P.r(F.x + 3, F.y + 3, F.w - 6, F.h - 6, R[2]);
      },
      t: topRim
    }, {
      x: .04,
      y: .95,
      w: .92,
      d: .05,
      z: 3,
      hh: 20,
      col: HB,
      boxo: {
        fi: 3
      },
      f: (P, F, g) => {
        const R = F.R;
        P.r(F.x + 3, F.y + 4, F.w - 6, 1, R[1]);
        P.r(F.x + Math.round(F.w / 2) - 5, F.y + 5, 10, 12, "#6a4a30").r(F.x + Math.round(F.w / 2) - 4, F.y + 6, 8, 10, "#e6e2d4");
      },
      s: (P, F) => {
        const R = F.R;
        P.r(F.x, F.y, F.w, 2, R[5]);
      },
      b: (P, F) => {
        const R = F.R;
        P.r(F.x + 3, F.y + 3, F.w - 6, F.h - 6, R[2]);
        P.r(F.x + Math.round(F.w / 2) - 5, F.y + 5, 10, 3, "#6a4a30");
      },
      t: topRim
    }, {
      x: 0,
      y: .28,
      w: .05,
      d: .4,
      z: 12,
      hh: 8,
      col: HM,
      skipBox: true,
      nohit: 1,
      all: (P, F) => {
        const M = RP(HM);
        P.r(F.x, F.y, F.w, 2, M[4]).r(F.x, F.y + F.h - 2, F.w, 2, M[2]);
        for (let x = F.x; x < F.x + F.w; x += 6) P.r(x, F.y, 1, F.h, M[3]);
      }
    }, {
      x: .95,
      y: .28,
      w: .05,
      d: .4,
      z: 12,
      hh: 8,
      col: HM,
      skipBox: true,
      nohit: 1,
      all: (P, F) => {
        const M = RP(HM);
        P.r(F.x, F.y, F.w, 2, M[4]).r(F.x, F.y + F.h - 2, F.w, 2, M[2]);
        for (let x = F.x; x < F.x + F.w; x += 6) P.r(x, F.y, 1, F.h, M[3]);
      }
    } ]
  });
  build("counter", {
    pad: 2,
    tpu: 20,
    col: (c, v) => c || [ "#7a6448", "#8a8a80", "#6a7a6a" ][v % 3],
    parts: [ {
      x: .02,
      y: .1,
      w: .96,
      d: .88,
      z: 0,
      hh: 3,
      noTop: 1,
      col: "#1b1c1f"
    }, {
      x: .02,
      y: .08,
      w: .96,
      d: .9,
      z: 3,
      hh: 13,
      noTop: 1,
      f: (P, F) => doorSeam(P, F, 4, {
        top: 1,
        bot: 1
      }),
      s: (P, F) => sidePanel(P, F, {
        top: 1,
        bot: 1
      }),
      b: (P, F, g) => {
        P.r(F.x + 2, F.y + 1, F.w - 4, F.h - 2, "#23252a");
        P.r(F.x + 2, F.y + Math.round(F.h / 2), F.w - 4, 1, F.R[4]);
        goods(P, F.x + 3, F.x + F.w - 3, F.y + Math.round(F.h / 2), 5, g, {
          empty: .3
        });
        goods(P, F.x + 3, F.x + F.w - 3, F.y + F.h - 1, 5, g, {
          empty: .3
        });
      }
    }, {
      x: 0,
      y: 0,
      w: 1,
      d: 1,
      z: 16,
      hh: 2,
      col: "#b8b4a8",
      metal: 1,
      all: (P, F) => edgeLines(P, F),
      t: (P, T, g) => {
        const Rt = T.R;
        P.noise(T.x + 1, T.y + 1, T.w - 2, Math.max(1, T.h - 2), [ Rt[3], Rt[5], Rt[2] ], .12, g);
        if (T.v % 2) {
          const sk = T.put(.47, .12, .38, .7);
          P.r(sk.x, sk.y, sk.w, sk.h, "#9aa2a8").r(sk.x + 1, sk.y + 1, Math.max(1, sk.w - 2), Math.max(1, sk.h - 2), "#5a6268");
          const bd = T.put(.06, .25, .22, .45);
          P.r(bd.x, bd.y, bd.w, bd.h, "#a8845a").r(bd.x, bd.y, bd.w, 1, "#c8a47a");
        } else if (T.v % 4 === 0) {
          const pp = T.put(.56, .2, .26, .5);
          P.r(pp.x, pp.y, pp.w, pp.h, "#d8d2bc").r(pp.x, pp.y, pp.w, 1, "#eae4d0");
        }
      }
    }, {
      x: 0,
      y: 0,
      w: 1,
      d: .06,
      z: 18,
      hh: 3,
      col: "#b8b4a8",
      metal: 1
    }, {
      x: .6,
      y: .02,
      w: .04,
      d: .08,
      z: 18,
      hh: 8,
      col: STEEL,
      metal: 1,
      nohit: 1,
      cond: v => v % 2 === 1
    }, {
      x: .1,
      y: .1,
      w: .36,
      d: .45,
      z: 18,
      hh: 9,
      col: "#3a3d44",
      cond: v => v % 2 === 0 && v % 4 === 0,
      t: (P, T) => {
        for (let y = T.y + 1; y < T.y + T.h - 1; y += 2) for (let x = T.x + 2; x < T.x + T.w - 1; x += 3) P.p(x, y, "#8a9098");
      }
    }, {
      x: .3,
      y: .08,
      w: .14,
      d: .1,
      z: 27,
      hh: 5,
      col: "#1a1c20",
      nohit: 1,
      cond: v => v % 2 === 0 && v % 4 === 0,
      f: (P, F) => {
        P.r(F.x + 1, F.y + 1, Math.max(1, F.w - 2), Math.max(1, F.h - 2), "#2a4a2a");
        P.r(F.x + 1, F.y + 2, Math.max(1, F.w - 3), 1, "#7ae07a");
      }
    }, {
      x: .08,
      y: .08,
      w: .42,
      d: .55,
      z: 18,
      hh: 12,
      col: "#d0ccc0",
      cond: v => v % 2 === 0 && v % 4 !== 0,
      f: (P, F) => {
        P.r(F.x + 2, F.y + 2, Math.round(F.w * .6), F.h - 4, "#1c2024");
        P.r(F.x + Math.round(F.w * .7), F.y + 2, Math.max(1, Math.round(F.w * .2)), F.h - 4, "#a8a498");
      },
      s: (P, F) => {
        const R = F.R;
        for (let y = F.y + 3; y < F.y + F.h - 2; y += 2) P.r(F.x + 2, y, Math.max(1, F.w - 4), 1, R[1]);
      },
      b: (P, F) => {
        const R = F.R;
        P.r(F.x + 2, F.y + 2, F.w - 4, F.h - 4, R[2]);
      }
    } ]
  });
  const shelfGoods = z => ({
    x: .06,
    y: .14,
    w: .88,
    d: .72,
    z,
    hh: 10,
    skipBox: true,
    nohit: 1,
    f: (P, F, g) => goods(P, F.x, F.x + F.w, F.y + F.h, 10, g, {
      empty: F.v % 4 === 3 ? .4 : .14
    }),
    s: (P, F, g) => goods(P, F.x, F.x + F.w, F.y + F.h, 10, g, {
      empty: .3
    }),
    b: (P, F, g) => {
      goods(P, F.x, F.x + F.w, F.y + F.h, 10, g, {
        empty: .2
      });
      P.r(F.x, F.y, F.w, F.h, "rgba(10,12,20,0.25)");
    }
  });
  const shelfBoard = (z, hh) => ({
    x: 0,
    y: 0,
    w: 1,
    d: 1,
    z,
    hh: hh || 2,
    metal: 1,
    all: (P, F) => {
      const R = F.R;
      P.r(F.x, F.y, F.w, 1, R[5]);
      if (F.h > 2) P.r(F.x, F.y + F.h - 1, F.w, 1, R[1]);
    },
    t: (P, T, g) => {
      const R = T.R;
      P.r(T.x, T.y, T.w, T.h, R[3]);
      P.r(T.x, T.y, T.w, 1, R[4]);
      rust(P, T.x + 1, T.y, T.w - 2, Math.max(1, T.h - 1), g, 2);
    }
  });
  build("shelf", {
    pad: 2,
    tpu: 12,
    col: (c, v) => c || [ "#6a7078", "#6e6a5c", "#5a6a70" ][v % 3],
    parts: [ {
      x: .02,
      y: 0,
      w: .96,
      d: .05,
      z: 2,
      hh: 53,
      col: "#1e2126",
      skipBox: true,
      nohit: 1,
      all: (P, F) => {
        P.r(F.x, F.y, F.w, F.h, "#1e2126");
        vgrad(P, F.x, F.y, F.w, F.h, "#2a2e34", "#181a1e", .1, .9);
        for (let x = F.x + 2; x < F.x + F.w - 1; x += 4) P.r(x, F.y, 1, F.h, "rgba(0,0,0,0.2)");
      },
      b: (P, F) => {
        P.r(F.x, F.y, F.w, F.h, "#2a2e34");
        for (let x = F.x + 2; x < F.x + F.w - 1; x += 4) for (let y = F.y + 2; y < F.y + F.h - 1; y += 4) P.p(x, y, "#0e1012");
      }
    }, shelfBoard(0, 3), shelfGoods(3), shelfBoard(11), shelfGoods(13), shelfBoard(25), shelfGoods(27), shelfBoard(39), shelfGoods(41), shelfBoard(53, 3), ...[ [ 0, 0 ], [ .95, 0 ], [ 0, .9 ], [ .95, .9 ] ].map(([x, y]) => ({
      x,
      y,
      w: .05,
      d: .1,
      z: 0,
      hh: 56,
      noTop: 1,
      metal: 1,
      all: (P, F) => {
        const R = F.R;
        P.r(F.x, F.y, 1, F.h, R[4]);
        for (let yy = F.y + 3; yy < F.y + F.h - 2; yy += 4) P.p(F.x + Math.round(F.w / 2), yy, R[0]);
      }
    })) ]
  });
  build("cabinet", {
    pad: 4,
    tpu: 12,
    col: (c, v) => c || (v === 5 ? "#d6d8d2" : [ "#8a8a80", "#6f7680", "#7a7460" ][v % 3]),
    parts: [ {
      x: 0,
      y: 0,
      w: 1,
      d: 1,
      z: 0,
      hh: 32,
      metal: 1,
      f: (P, F) => drawers(P, F, 4, {
        top: 1,
        bot: 2,
        handle: "#d8d2bc",
        hl: "#a8a28c"
      }),
      s: (P, F, g) => {
        const R = F.R;
        sidePanel(P, F, {
          top: 1,
          bot: 2
        });
        for (const t of [ .25, .5, .75 ]) P.r(F.x + 2, F.y + Math.round(F.h * t), F.w - 4, 1, R[2]);
        if (F.v === 5) {
          const cx = F.x + Math.round(F.w / 2);
          P.r(cx - 1, F.y + 8, 3, 9, "#c83a34").r(cx - 4, F.y + 11, 9, 3, "#c83a34");
        }
        rust(P, F.x + 1, F.y + F.h - 5, F.w - 2, 4, g, 2);
      },
      b: (P, F) => {
        const R = F.R;
        P.r(F.x + 2, F.y + 2, F.w - 4, F.h - 4, R[2]);
        P.r(F.x + Math.round(F.w / 2) - 4, F.y + 5, 8, 4, "#d8d2bc");
        for (const [x, y] of [ [ F.x + 3, F.y + 3 ], [ F.x + F.w - 5, F.y + 3 ], [ F.x + 3, F.y + F.h - 6 ], [ F.x + F.w - 5, F.y + F.h - 6 ] ]) rivet(P, x, y, R);
      },
      t: (P, T, g) => {
        topRim(P, T);
        if (T.v % 2) {
          const pp = T.put(.2, .2, .5, .5);
          P.r(pp.x, pp.y, pp.w, pp.h, "#e8e4d8").r(pp.x, pp.y, pp.w, 1, "#ffffff");
        }
        grime(P, T.x + 1, T.y + 1, T.w - 2, Math.max(1, T.h - 2), g, 3);
      }
    } ]
  });
  build("crate", {
    pad: 2,
    tpu: 14,
    col: (c, v) => c || (v % 2 ? "#56613f" : "#8a6a40"),
    parts: [ {
      x: 0,
      y: 0,
      w: 1,
      d: 1,
      z: 0,
      hh: 18,
      base: (P, F, g) => {
        const R = F.R, olive = F.v % 2 === 1;
        if (olive) {
          P.r(F.x + 1, F.y + 1, F.w - 2, 1, R[1]);
          P.r(F.x, F.y, 2, F.h, R[1]).r(F.x + F.w - 2, F.y, 2, F.h, R[1]);
          scratch(P, F.x + 2, F.y + 2, F.w - 4, F.h - 4, g, 4, R[5]);
        } else {
          for (let k = 0; k < 3; k++) {
            const y = F.y + k * 6;
            P.r(F.x + 1, y, F.w - 2, 5, k % 2 ? R[2] : R[3]).r(F.x + 1, y, F.w - 2, 1, R[4]).r(F.x + 1, y + 5, F.w - 2, 1, R[1]);
          }
          for (const x of [ F.x + 3, F.x + F.w - 6 ]) P.r(x, F.y, 3, F.h, "#4a4d52").r(x, F.y, 1, F.h, "#7a7d82");
        }
      },
      s: (P, F) => {
        if (F.v % 2 === 1) {
          const cx = F.x + Math.round(F.w / 2);
          P.r(cx - 5, F.y + 5, 10, 3, "#3a3d38").r(cx - 5, F.y + 5, 10, 1, "#7a7d78");
          PP.mini(P, F.x, F.y + 10, "AMMO".slice(0, Math.max(1, Math.floor((F.w + 1) / 4))), "#d8d0a0", F.w);
        }
      },
      b: (P, F) => {
        if (F.v % 2 === 1) {
          PP.label(P, F.x, F.y + 4, [ "탄약", "군용", "보급" ][(F.v >> 1) % 3], "#d8d0a0", 7, F.w);
        }
      },
      t: (P, T, g) => {
        const R = T.R;
        if (T.v % 2 === 1) {
          P.r(T.x + 2, T.y + 2, T.w - 4, Math.max(1, T.h - 4), R[4]);
          P.r(T.x + 2, T.y + 2, T.w - 4, 1, R[5]);
        } else {
          grain(P, T.x + 1, T.y + 1, T.w - 2, Math.max(1, T.h - 2), T.col, g, 12);
          const a = T.put(.1, 0, .1, 1), b = T.put(.8, 0, .1, 1);
          P.r(a.x, a.y, a.w, a.h, "#4a4d52");
          P.r(b.x, b.y, b.w, b.h, "#4a4d52");
        }
      }
    } ]
  });
  build("vending", {
    pad: 3,
    tpu: 10,
    col: (c, v) => c || [ "#a8342e", "#2e5aa0", "#2f7a4a" ][v % 3],
    parts: [ {
      x: 0,
      y: 0,
      w: 1,
      d: 1,
      z: 0,
      hh: 46,
      metal: 1,
      all: (P, F) => {
        const R = F.R;
        P.r(F.x, F.y + F.h - 4, F.w, 3, R[1]);
      },
      s: (P, F, g) => {
        const R = F.R;
        P.r(F.x + 1, F.y + 2, F.w - 2, 6, R[4]).r(F.x + 1, F.y + 2, F.w - 2, 1, R[5]);
        P.thick(F.x + 2, F.y + F.h - 12, F.x + F.w - 3, F.y + 14, 3, rgba("#ffffff", .18));
        for (let y = F.y + F.h - 10; y < F.y + F.h - 5; y += 2) P.r(F.x + 3, y, F.w - 6, 1, R[1]);
        P.r(F.x + 3, F.y + 20, 5, 4, "#e8e4d8").r(F.x + 3, F.y + 20, 5, 1, "#b83a34");
        rust(P, F.x + 1, F.y + F.h - 6, F.w - 2, 4, g, 3);
      },
      b: (P, F, g) => {
        const R = F.R;
        P.r(F.x + 2, F.y + 2, F.w - 4, F.h - 6, R[2]);
        P.r(F.x + 4, F.y + 6, F.w - 8, 14, "#2a2c30");
        for (let y = F.y + 8; y < F.y + 19; y += 2) P.r(F.x + 5, y, F.w - 10, 1, "#4a4d54");
        cord(P, F.x + F.w - 6, F.y + 22, F.h - 26);
      },
      t: (P, T) => {
        const R = T.R;
        for (let x = T.x + 3; x < T.x + T.w - 2; x += 3) P.r(x, T.y + 1, 2, Math.max(1, T.h - 2), R[3]);
      }
    } ]
  });
  build("copier", {
    pad: 3,
    tpu: 12,
    col: "#c3c4bc",
    parts: [ {
      x: .06,
      y: 0,
      w: .94,
      d: 1,
      z: 0,
      hh: 24,
      boxo: {
        fi: 3
      },
      all: (P, F) => {
        P.r(F.x, F.y + F.h - 4, F.w, 3, "#5a5c62");
      },
      s: (P, F) => {
        const R = F.R;
        for (const t of [ .52, .78 ]) P.r(F.x + 2, F.y + Math.round(F.h * t), F.w - 4, 1, R[1]);
        for (let y = F.y + 3; y < F.y + 10; y += 2) P.r(F.x + 3, y, F.w - 6, 1, R[2]);
      },
      b: (P, F) => {
        const R = F.R;
        P.r(F.x + 2, F.y + 2, F.w - 4, F.h - 6, R[2]);
        for (let y = F.y + 4; y < F.y + 12; y += 2) P.r(F.x + 4, y, F.w - 8, 1, R[1]);
        cord(P, F.x + 5, F.y + 13, 8);
      },
      t: (P, T) => {
        const D = RP("#5a5c62"), cv = T.put(.05, .1, .62, .8), pn = T.put(.72, .15, .24, .7);
        P.r(cv.x, cv.y, cv.w, cv.h, D[3]).r(cv.x, cv.y, cv.w, 1, D[4]);
        P.r(pn.x, pn.y, pn.w, pn.h, "#2a3a2a");
        P.r(pn.x, pn.y, pn.w, 1, "#6a9a6a");
      }
    }, {
      x: 0,
      y: .3,
      w: .08,
      d: .4,
      z: 12,
      hh: 2,
      col: "#e8e4d8",
      nohit: 1
    } ]
  });
  const SINK = "#d8d8d0";
  build("sink", {
    front: true,
    pad: 4,
    tpu: 26,
    sh: .34,
    col: SINK,
    parts: [ {
      x: .34,
      y: .14,
      w: .32,
      d: .26,
      z: 0,
      hh: 13,
      noTop: 1,
      all: (P, F) => {
        const R = F.R;
        P.r(F.x, F.y, 1, F.h, R[5]);
        P.r(F.x + F.w - 1, F.y, 1, F.h, R[2]);
        P.r(F.x - 1, F.y + F.h - 2, F.w + 2, 2, R[2]).r(F.x - 1, F.y + F.h - 2, F.w + 2, 1, R[4]);
      }
    }, {
      x: .04,
      y: 0,
      w: .92,
      d: .55,
      z: 13,
      hh: 5,
      boxo: {
        fi: 3
      },
      f: (P, F, g) => {
        const R = F.R;
        P.r(F.x + 1, F.y + F.h - 1, F.w - 2, 1, R[1]);
        grime(P, F.x + 2, F.y + 1, F.w - 4, F.h - 2, g, 2, "rgba(120,100,50,0.2)");
      },
      t: (P, T, g) => {
        const R = T.R, b = T.put(.1, .22, .8, .66), cx = b.x + Math.round(b.w / 2), cy = b.y + Math.round(b.h / 2), rx = Math.max(1, Math.round(b.w / 2)), ry = Math.max(1, Math.round(b.h / 2));
        P.r(T.x, T.y, T.w, T.h, R[4]);
        P.r(T.x, T.y, T.w, 1, R[5]);
        P.oval(cx, cy, rx, ry, R[1]).oval(cx, cy, Math.max(1, rx - 1), Math.max(1, ry - 1), R[3]).oval(cx, cy + 1, Math.max(1, rx - 2), Math.max(1, ry - 2), R[2]);
        P.p(cx, cy + 1, "#2a2c30");
        drip(P, cx + 2, cy - 1, 2, "rgba(130,80,30,0.35)");
        grime(P, T.x + 1, T.y + 1, T.w - 2, Math.max(1, T.h - 2), g, 3, "rgba(120,100,50,0.2)");
      }
    }, {
      x: .44,
      y: .03,
      w: .12,
      d: .14,
      z: 18,
      hh: 5,
      col: STEEL,
      metal: 1,
      nohit: 1,
      all: (P, F) => {
        P.r(F.x, F.y, F.w, 1, "#e8f0f4");
      },
      t: (P, T) => {
        const sp = T.put(.3, .6, .4, .6);
        P.r(sp.x, sp.y, Math.max(1, sp.w), Math.max(1, sp.h), "#8a9298");
      }
    }, {
      x: .26,
      y: .04,
      w: .1,
      d: .08,
      z: 18,
      hh: 2,
      col: "#c84040",
      nohit: 1
    }, {
      x: .64,
      y: .04,
      w: .1,
      d: .08,
      z: 18,
      hh: 2,
      col: "#4060c0",
      nohit: 1
    }, {
      x: .1,
      y: .06,
      w: .14,
      d: .12,
      z: 18,
      hh: 2,
      col: "#e8d8a0",
      nohit: 1,
      cond: v => v % 2 === 0,
      t: (P, T) => {
        P.r(T.x, T.y, T.w, T.h, "#f8ecc0");
      }
    } ]
  });
  build("toilet", {
    front: true,
    pad: 6,
    tpu: 26,
    sh: .34,
    col: "#dcdcd4",
    parts: [ {
      x: .3,
      y: .3,
      w: .4,
      d: .34,
      z: 0,
      hh: 7,
      noTop: 1,
      all: (P, F) => {
        const R = F.R;
        P.r(F.x, F.y, 1, F.h, R[5]);
        P.r(F.x + F.w - 1, F.y, 1, F.h, R[2]);
      }
    }, {
      x: .08,
      y: .18,
      w: .84,
      d: .52,
      z: 7,
      hh: 4,
      boxo: {
        fi: 3
      },
      f: (P, F, g) => {
        grime(P, F.x + 1, F.y, F.w - 2, F.h, g, 2, "rgba(140,120,40,0.22)");
      },
      t: (P, T, g) => {
        const R = T.R, s = T.put(.06, .06, .88, .9), cx = s.x + Math.round(s.w / 2), cy = s.y + Math.round(s.h / 2), rx = Math.max(1, Math.round(s.w / 2)), ry = Math.max(1, Math.round(s.h / 2));
        P.r(T.x, T.y, T.w, T.h, R[4]);
        P.oval(cx, cy, rx, ry, R[5]).oval(cx, cy, Math.max(1, rx - 2), Math.max(1, ry - 2), R[1]).oval(cx, cy, Math.max(1, rx - 3), Math.max(1, ry - 3), "#6a7a5a");
        P.p(cx - 1, cy, "#9aaa8a");
        grime(P, s.x, s.y, s.w, s.h, g, 3, "rgba(140,120,40,0.22)");
      }
    }, {
      x: .12,
      y: 0,
      w: .76,
      d: .18,
      z: 5,
      hh: 14,
      boxo: {
        fi: 3
      },
      f: (P, F) => {
        const R = F.R;
        P.r(F.x + 2, F.y + 2, 3, 1, "#a8b0b4");
        P.r(F.x + 1, F.y + F.h - 2, F.w - 2, 1, R[1]);
      },
      t: (P, T) => {
        P.r(T.x, T.y, T.w, 1, T.R[5]);
        const lv = T.put(.1, .3, .14, .4);
        P.r(lv.x, lv.y, Math.max(2, lv.w), Math.max(1, lv.h), "#a8b0b4");
      }
    }, {
      x: .14,
      y: .18,
      w: .72,
      d: .05,
      z: 11,
      hh: 11,
      nohit: 1,
      all: (P, F, g) => {
        const R = F.R;
        P.r(F.x, F.y, F.w, 1, R[5]);
        P.r(F.x, F.y + F.h - 1, F.w, 1, R[2]);
        if (F.v % 3 === 1) P.line(F.x + F.w - 3, F.y + 2, F.x + F.w - 6, F.y + 7, R[0]);
      }
    } ]
  });
  build("board", {
    pad: 2,
    tpu: 10,
    col: "#8a9098",
    parts: [ {
      x: .04,
      y: .2,
      w: .08,
      d: .6,
      z: 0,
      hh: 2,
      noTop: 1,
      col: "#18191c"
    }, {
      x: .88,
      y: .2,
      w: .08,
      d: .6,
      z: 0,
      hh: 2,
      noTop: 1,
      col: "#18191c"
    }, {
      x: .07,
      y: .46,
      w: .03,
      d: .05,
      z: 0,
      hh: 20,
      noTop: 1,
      metal: 1
    }, {
      x: .9,
      y: .46,
      w: .03,
      d: .05,
      z: 0,
      hh: 20,
      noTop: 1,
      metal: 1
    }, {
      x: 0,
      y: .44,
      w: 1,
      d: .06,
      z: 17,
      hh: 32,
      skipBox: true,
      metal: 1,
      base: (P, F) => {
        const M = RP("#8a9098");
        P.r(F.x, F.y, F.w, F.h, M[3]);
        P.r(F.x, F.y, F.w, 2, M[5]);
      },
      f: (P, F) => {
        if (F.w > 6) P.r(F.x + 2, F.y + 2, F.w - 4, F.h - 4, "#e4e4dc");
      },
      b: (P, F) => {
        const M = RP("#8a9098");
        if (F.w > 6) {
          P.r(F.x + 2, F.y + 2, F.w - 4, F.h - 4, M[2]);
          P.r(F.x + Math.round(F.w / 2) - 6, F.y + 5, 12, 4, "#d8d2bc");
          P.r(F.x + 3, F.y + Math.round(F.h / 2), F.w - 6, 1, M[1]);
        }
      },
      s: (P, F) => {
        const M = RP("#8a9098");
        P.r(F.x, F.y, F.w, F.h, M[2]);
        P.r(F.x, F.y, 1, F.h, M[4]);
      },
      t: (P, T) => {
        P.r(T.x, T.y, T.w, T.h, "#b8bcc0");
      }
    }, {
      x: .2,
      y: .5,
      w: .6,
      d: .07,
      z: 16,
      hh: 2,
      col: "#6a7078",
      nohit: 1,
      t: (P, T) => {
        P.r(T.x + 2, T.y, 4, Math.max(1, T.h), "#2a4aa0");
        P.r(T.x + 8, T.y, 4, Math.max(1, T.h), "#b0302a");
      }
    } ]
  });
  build("mapBoard", {
    pad: 1,
    tpu: 8,
    col: "#6a4a30",
    parts: [ {
      x: .17,
      y: .46,
      w: .1,
      d: .08,
      z: 0,
      hh: 20,
      noTop: 1,
      wood: 1
    }, {
      x: .73,
      y: .46,
      w: .1,
      d: .08,
      z: 0,
      hh: 20,
      noTop: 1,
      wood: 1
    }, {
      x: .03,
      y: .42,
      w: .94,
      d: .12,
      z: 18,
      hh: 25,
      skipBox: true,
      wood: 1,
      base: (P, F) => {
        const R = RP("#6a4a30");
        P.r(F.x, F.y, F.w, F.h, R[2]);
        P.r(F.x, F.y, F.w, 1, R[4]);
        P.r(F.x, F.y + F.h - 1, F.w, 1, R[0]);
      },
      f: (P, F) => {
        if (F.w > 6) P.r(F.x + 2, F.y + 2, F.w - 4, F.h - 4, "#d8cca4");
      },
      b: (P, F) => planks(P, {
        x: F.x,
        y: F.y,
        w: F.w,
        h: F.h,
        R: RP("#6a4a30")
      }, 3),
      s: (P, F) => {
        const R = RP("#6a4a30");
        P.r(F.x, F.y, F.w, F.h, R[3]);
      },
      t: (P, T) => {
        P.r(T.x, T.y, T.w, T.h, RP("#6a4a30")[3]);
      }
    }, {
      x: 0,
      y: .32,
      w: 1,
      d: .32,
      z: 43,
      hh: 3,
      wood: 1,
      nohit: 1,
      all: (P, F) => {
        const R = F.R;
        P.r(F.x, F.y + F.h - 1, F.w, 1, R[0]);
      },
      t: (P, T) => {
        const R = T.R;
        P.r(T.x, T.y, T.w, T.h, R[3]);
        for (let y = T.y + 1; y < T.y + T.h; y += 2) P.r(T.x, y, T.w, 1, R[2]);
        P.r(T.x, T.y, T.w, 1, R[5]);
      }
    } ]
  });
  build("partition", {
    pad: 2,
    tpu: 8,
    col: (c, v) => c || [ "#5f6a7a", "#6a6a5e", "#5a6a62" ][v % 3],
    parts: [ {
      x: .1,
      y: .2,
      w: .12,
      d: .6,
      z: 0,
      hh: 4,
      noTop: 1,
      col: "#2a2c30"
    }, {
      x: .78,
      y: .2,
      w: .12,
      d: .6,
      z: 0,
      hh: 4,
      noTop: 1,
      col: "#2a2c30"
    }, {
      x: 0,
      y: .43,
      w: 1,
      d: .14,
      z: 1,
      hh: 38,
      skipBox: true,
      base: (P, F, g, col) => {
        const R = RP(col), M = RP("#a8acb0");
        P.r(F.x, F.y, F.w, F.h, R[3]);
        P.noise(F.x + 1, F.y, Math.max(1, F.w - 2), F.h, [ R[2], R[4] ], .3, g);
        P.r(F.x, F.y, 2, F.h, M[4]).r(F.x + F.w - 2, F.y, 2, F.h, M[1]);
      },
      s: (P, F, g, col) => {
        const M = RP("#a8acb0");
        P.r(F.x, F.y, F.w, F.h, M[3]);
        P.r(F.x, F.y, 1, F.h, M[5]);
        P.r(F.x + Math.round(F.w / 2), F.y + 2, 1, F.h - 4, RP(col)[2]);
      },
      b: (P, F, g) => {
        P.r(F.x + 5, F.y + 6, 3, 4, "#9aa0a8");
      }
    }, {
      x: 0,
      y: .43,
      w: 1,
      d: .14,
      z: 39,
      hh: 3,
      col: "#a8acb0",
      metal: 1,
      nohit: 1
    } ]
  });
  function stripes(P, F) {
    P.r(F.x, F.y, F.w, F.h, "#e8e4d8");
    for (let x = -F.h; x < F.w; x += 8) P.poly([ [ F.x + x, F.y + F.h ], [ F.x + x + F.h, F.y ], [ F.x + x + F.h + 4, F.y ], [ F.x + x + 4, F.y + F.h ] ], "#d86a24");
    P.r(F.x, F.y, F.w, 1, "rgba(255,255,255,0.35)").r(F.x, F.y + F.h - 1, F.w, 1, "rgba(0,0,0,0.3)");
  }
  build("barrier", {
    pad: 3,
    tpu: 8,
    col: "#5a5e64",
    parts: [ {
      x: .09,
      y: .2,
      w: .08,
      d: .6,
      z: 0,
      hh: 3,
      noTop: 1
    }, {
      x: .83,
      y: .2,
      w: .08,
      d: .6,
      z: 0,
      hh: 3,
      noTop: 1
    }, {
      x: .11,
      y: .46,
      w: .04,
      d: .05,
      z: 0,
      hh: 28,
      noTop: 1,
      metal: 1
    }, {
      x: .85,
      y: .46,
      w: .04,
      d: .05,
      z: 0,
      hh: 28,
      noTop: 1,
      metal: 1
    }, {
      x: 0,
      y: .44,
      w: 1,
      d: .07,
      z: 10,
      hh: 6,
      skipBox: true,
      f: (P, F) => stripes(P, F),
      b: (P, F) => stripes(P, F),
      s: (P, F) => {
        P.r(F.x, F.y, F.w, F.h, "#d86a24");
        P.r(F.x, F.y, F.w, 1, "#e8e4d8");
      },
      t: (P, T) => {
        P.r(T.x, T.y, T.w, T.h, "#e8e4d8");
      }
    }, {
      x: 0,
      y: .44,
      w: 1,
      d: .07,
      z: 21,
      hh: 7,
      skipBox: true,
      nohit: 1,
      f: (P, F) => stripes(P, F),
      b: (P, F) => stripes(P, F),
      s: (P, F) => {
        P.r(F.x, F.y, F.w, F.h, "#d86a24");
        P.r(F.x, F.y, F.w, 1, "#e8e4d8");
      },
      t: (P, T) => {
        P.r(T.x, T.y, T.w, T.h, "#e8e4d8");
      }
    }, {
      x: .02,
      y: .42,
      w: .12,
      d: .1,
      z: 29,
      hh: 6,
      col: "#1e2024",
      nohit: 1,
      all: (P, F) => {
        P.r(F.x + 1, F.y + 1, Math.max(1, F.w - 2), F.h - 2, "#e8a030");
        P.r(F.x + 1, F.y + 1, Math.max(1, Math.round(F.w / 3)), 1, "#fff0a0");
      }
    } ]
  });
  build("atm", {
    pad: 3,
    tpu: 8,
    col: "#5a6270",
    parts: [ {
      x: 0,
      y: 0,
      w: 1,
      d: 1,
      z: 0,
      hh: 42,
      metal: 1,
      s: (P, F, g) => {
        const R = F.R;
        P.r(F.x, F.y + 8, F.w, 6, "#2a6ab0").r(F.x, F.y + 8, F.w, 1, "#6aa0e0");
        sidePanel(P, {
          x: F.x,
          y: F.y + 15,
          w: F.w,
          h: F.h - 15,
          R
        }, {
          top: 1,
          bot: 3
        });
        for (const y of [ F.y + F.h - 6 ]) {
          rivet(P, F.x + 2, y, R);
          rivet(P, F.x + F.w - 3, y, R);
        }
        scratch(P, F.x + 1, F.y + 16, F.w - 2, F.h - 22, g, 3, R[5]);
      },
      b: (P, F, g) => {
        const R = F.R;
        P.r(F.x + 2, F.y + 3, F.w - 4, F.h - 7, R[2]);
        P.r(F.x + 4, F.y + 6, F.w - 8, 16, R[1]).r(F.x + 4, F.y + 6, F.w - 8, 1, R[3]);
        P.r(F.x + F.w - 8, F.y + 12, 3, 3, "#c8a040");
        for (let y = F.y + 25; y < F.y + 33; y += 2) P.r(F.x + 4, y, F.w - 8, 1, R[1]);
        cord(P, F.x + 6, F.y + 34, 6);
      },
      t: topRim
    } ]
  });
  build("sign", {
    pad: 2,
    tpu: 8,
    col: (c, v) => c || [ "#2a4a8a", "#8a2a2a", "#2a6a3a", "#8a6a1a" ][v % 4],
    parts: [ {
      x: .15,
      y: .46,
      w: .05,
      d: .08,
      z: 0,
      hh: 20,
      noTop: 1,
      col: "#4a4d52",
      metal: 1
    }, {
      x: .8,
      y: .46,
      w: .05,
      d: .08,
      z: 0,
      hh: 20,
      noTop: 1,
      col: "#4a4d52",
      metal: 1
    }, {
      x: 0,
      y: .42,
      w: 1,
      d: .1,
      z: 16,
      hh: 28,
      skipBox: true,
      base: (P, F) => {
        const M = RP("#4a4d52");
        P.r(F.x, F.y, F.w, F.h, M[1]);
      },
      f: (P, F, g, col) => {
        const R = RP(col);
        if (F.w > 4) P.r(F.x + 1, F.y + 1, F.w - 2, F.h - 2, R[3]);
      },
      b: (P, F) => {
        const M = RP("#4a4d56");
        if (F.w < 6) return;
        P.r(F.x + 1, F.y + 1, F.w - 2, F.h - 2, M[2]);
        P.r(F.x + 1, F.y + Math.round(F.h / 2), F.w - 2, 2, M[3]);
        for (let k = 1; k < 4; k++) P.r(F.x + Math.round(k * F.w / 4), F.y + 1, 2, F.h - 2, M[3]);
        for (const x of [ F.x + 3, F.x + F.w - 5 ]) for (const y of [ F.y + 3, F.y + F.h - 5 ]) rivet(P, x, y, M);
      },
      s: (P, F, g, col) => {
        const M = RP("#4a4d52");
        P.r(F.x, F.y, F.w, F.h, M[2]);
        P.r(F.x + F.w - 1, F.y + 1, 1, F.h - 2, RP(col)[3]);
      },
      t: (P, T) => {
        P.r(T.x, T.y, T.w, T.h, RP("#4a4d52")[4]);
      }
    }, {
      x: .24,
      y: .5,
      w: .06,
      d: .14,
      z: 44,
      hh: 4,
      col: "#2a2c30",
      nohit: 1,
      all: (P, F) => {
        P.r(F.x, F.y + F.h - 1, F.w, 1, "#f0e0a0");
      }
    }, {
      x: .7,
      y: .5,
      w: .06,
      d: .14,
      z: 44,
      hh: 4,
      col: "#2a2c30",
      nohit: 1,
      all: (P, F) => {
        P.r(F.x, F.y + F.h - 1, F.w, 1, "#f0e0a0");
      }
    } ]
  });
  build("ac", {
    pad: 3,
    tpu: 18,
    col: "#9a9d98",
    parts: [ {
      x: .04,
      y: .04,
      w: .92,
      d: .92,
      z: 0,
      hh: 2,
      noTop: 1,
      col: "#3a3c3e"
    }, {
      x: 0,
      y: 0,
      w: 1,
      d: 1,
      z: 2,
      hh: 22,
      metal: 1,
      f: (P, F) => {
        const R = F.R;
        for (let y = F.y + 3; y < F.y + F.h - 3; y += 3) P.r(F.x + 2, y, Math.round(F.w * .66), 1, R[0]);
        P.r(F.x + Math.round(F.w * .74), F.y + 2, Math.round(F.w * .22), F.h - 5, R[3]);
      },
      s: (P, F, g) => {
        const R = F.R;
        for (let y = F.y + 3; y < F.y + F.h - 3; y += 3) P.r(F.x + 2, y, F.w - 4, 1, R[0]);
        rust(P, F.x + 1, F.y + 1, F.w - 2, F.h - 2, g, 4);
      },
      b: (P, F, g) => {
        const R = F.R;
        P.r(F.x + 2, F.y + 2, F.w - 4, F.h - 5, "#2a2c2e");
        for (let x = F.x + 3; x < F.x + F.w - 2; x += 2) P.r(x, F.y + 3, 1, F.h - 7, R[2]);
      },
      t: (P, T, g) => {
        const R = T.R, D = RP("#3a3d40"), q = T.put(.12, .08, .76, .84), cx = q.x + Math.round(q.w / 2), cy = q.y + Math.round(q.h / 2), rx = Math.max(3, Math.round(q.w / 2)), ry = Math.max(3, Math.round(q.h / 2));
        P.oval(cx, cy, rx, ry, R[2]).oval(cx, cy, rx - 1, ry - 1, D[1]).oval(cx, cy, rx - 2, ry - 2, D[0]);
        for (let b = 0; b < 4; b++) {
          const a = b * Math.PI / 2 + T.v % 4 * .4;
          P.line(cx, cy, Math.round(cx + Math.cos(a) * (rx - 3)), Math.round(cy + Math.sin(a) * (ry - 3)), D[4]);
        }
        for (const r of [ .33, .66 ]) P.ring(cx, cy, Math.max(1, Math.round(rx * r)), Math.max(1, Math.round(ry * r)), R[3]);
        P.oval(cx, cy, 2, 2, R[4]);
        rust(P, T.x + 1, T.y + 1, T.w - 2, T.h - 2, g, 6);
      }
    }, {
      x: .96,
      y: .62,
      w: .04,
      d: .12,
      z: 6,
      hh: 8,
      col: "#b87a4a",
      nohit: 1
    } ]
  });
  function tankPanels(P, F) {
    const R = F.R;
    for (let x = F.x; x < F.x + F.w - 2; x += 14) {
      for (let y = F.y; y < F.y + F.h - 2; y += 12) {
        const w = Math.min(10, F.x + F.w - x - 4), h = Math.min(8, F.y + F.h - y - 4);
        if (w < 3 || h < 3) continue;
        P.r(x + 2, y + 2, w, h, R[3]).r(x + 2, y + 2, w, 1, R[4]).r(x + 2, y + 2, 1, h, R[4]).r(x + 1 + w, y + 2, 1, h, R[1]).r(x + 2, y + 1 + h, w, 1, R[1]);
      }
    }
  }
  build("tank", {
    pad: 3,
    tpu: 16,
    col: (c, v) => c || [ "#6a9ab0", "#7aa088", "#c8c4a8" ][v % 3],
    parts: [ {
      x: 0,
      y: .04,
      w: 1,
      d: .92,
      z: 0,
      hh: 6,
      noTop: 1,
      col: "#4a4d50",
      all: (P, F) => {
        const S = RP("#4a4d50");
        P.r(F.x, F.y, F.w, 1, S[4]);
        for (let x = F.x + 5; x < F.x + F.w - 2; x += 12) P.r(x, F.y + 1, 2, F.h - 2, S[1]);
      }
    }, {
      x: .017,
      y: 0,
      w: .966,
      d: 1,
      z: 6,
      hh: 36,
      all: (P, F, g) => {
        tankPanels(P, F);
        grime(P, F.x + 1, F.y + 1, F.w - 2, F.h - 2, g, 10, "rgba(40,50,30,0.18)");
      },
      t: (P, T, g) => {
        const R = T.R;
        for (let x = T.x + 14; x < T.x + T.w - 2; x += 14) P.r(x, T.y, 1, T.h, R[3]);
        const mh = T.put(.16, .26, .25, .36);
        P.r(mh.x, mh.y, mh.w, mh.h, R[2]).r(mh.x + 1, mh.y + 1, Math.max(1, mh.w - 2), Math.max(1, mh.h - 2), R[4]).r(mh.x + 1, mh.y + 1, Math.max(1, mh.w - 2), 1, R[5]);
      }
    }, {
      x: .72,
      y: .14,
      w: .06,
      d: .06,
      z: 42,
      hh: 8,
      col: "#8a9098",
      metal: 1,
      nohit: 1
    }, {
      x: .7,
      y: .97,
      w: .16,
      d: .03,
      z: 4,
      hh: 38,
      col: "#4a4d50",
      skipBox: true,
      nohit: 1,
      f: (P, F) => {
        const S = RP("#4a4d50");
        P.r(F.x, F.y, 2, F.h, S[3]).r(F.x + F.w - 2, F.y, 2, F.h, S[3]);
        for (let y = F.y + 3; y < F.y + F.h - 1; y += 5) P.r(F.x, y, F.w, 1, S[4]).r(F.x, y + 1, F.w, 1, S[1]);
      },
      s: (P, F) => {
        const S = RP("#4a4d50");
        P.r(F.x, F.y, Math.max(1, F.w), F.h, S[3]);
        for (let y = F.y + 3; y < F.y + F.h - 1; y += 5) P.r(F.x - 1, y, Math.max(1, F.w) + 1, 1, S[4]);
      }
    } ]
  });
  const TM = "#3a3d42";
  build("treadmill", {
    front: true,
    pad: 2,
    tpu: 14,
    sh: .4,
    col: TM,
    parts: [ {
      x: .02,
      y: .24,
      w: .78,
      d: .62,
      z: 0,
      hh: 4,
      col: "#1e2024",
      all: (P, F) => {
        const K = RP("#1e2024");
        P.r(F.x, F.y, F.w, 1, K[3]);
      },
      t: (P, T) => {
        const K = RP("#1e2024");
        P.r(T.x, T.y, T.w, T.h, K[2]);
        for (let u = .06; u < .96; u += .08) {
          const q = T.put(u, .08, .03, .84);
          P.r(q.x, q.y, Math.max(1, q.w), Math.max(1, q.h), K[3]);
        }
      }
    }, {
      x: .02,
      y: .16,
      w: .8,
      d: .08,
      z: 0,
      hh: 5,
      metal: 1,
      t: (P, T) => {
        P.r(T.x, T.y, T.w, T.h, RP(TM)[4]);
      }
    }, {
      x: .02,
      y: .86,
      w: .8,
      d: .08,
      z: 0,
      hh: 5,
      metal: 1,
      t: (P, T) => {
        P.r(T.x, T.y, T.w, T.h, RP(TM)[4]);
      }
    }, {
      x: .78,
      y: .2,
      w: .14,
      d: .7,
      z: 0,
      hh: 7,
      metal: 1,
      f: (P, F) => {
        P.r(F.x + 1, F.y + 2, F.w - 2, 2, RP(TM)[1]);
      }
    }, {
      x: .84,
      y: .18,
      w: .05,
      d: .07,
      z: 7,
      hh: 14,
      noTop: 1,
      metal: 1,
      over: 1
    }, {
      x: .84,
      y: .84,
      w: .05,
      d: .07,
      z: 7,
      hh: 14,
      noTop: 1,
      metal: 1,
      over: 1
    }, {
      x: .2,
      y: .18,
      w: .68,
      d: .05,
      z: 18,
      hh: 3,
      metal: 1,
      nohit: 1,
      over: 1
    }, {
      x: .2,
      y: .86,
      w: .68,
      d: .05,
      z: 18,
      hh: 3,
      metal: 1,
      nohit: 1,
      over: 1
    }, {
      x: .78,
      y: .22,
      w: .16,
      d: .66,
      z: 21,
      hh: 5,
      col: "#1c1d21",
      nohit: 1,
      over: 1,
      all: (P, F) => {
        P.r(F.x, F.y, F.w, 1, "#3a3d44");
      },
      t: (P, T) => {
        P.r(T.x, T.y, T.w, T.h, "#26282e");
        const sc = T.put(.1, .2, .55, .6);
        P.r(sc.x, sc.y, Math.max(1, sc.w), Math.max(1, sc.h), "#4ac0ff");
        P.r(sc.x, sc.y, Math.max(1, sc.w), 1, "#a8e8ff");
        const bt = T.put(.72, .3, .14, .4);
        P.r(bt.x, bt.y, Math.max(1, bt.w), Math.max(1, bt.h), "#c84040");
      }
    } ]
  });
  const TREAD_U = (.4 * 64 - 2) / 60, TREAD_V = .56, TREAD_TOP = 4;
  A.treadSpot = function(p) {
    const rot = (p.rot | 0) & 3, M = A.rotModel("treadmill"), G = M && M._geo ? M._geo(rot) : null;
    if (!G) return null;
    const t = R2.turn({
      x: TREAD_U,
      y: TREAD_V,
      w: 0,
      d: 0
    }, rot), pad = M.pad == null ? 3 : M.pad;
    const sx = pad + t.x * G.Wpx, sy = G.FH * 32 - 2 - (1 - t.y) * G.Dpx - TREAD_TOP;
    return {
      x: p.x + sx / 32,
      y: p.y + sy / 32,
      dir: [ 1, 2, 3, 0 ][rot],
      side: !(rot & 1)
    };
  };
  const IRONB = "#3a3d42", PLT = "#1e2024";
  const barOn = v => v !== 1;
  const bpPlate = x => ({
    x,
    y: .05,
    w: .035,
    d: .28,
    z: 13,
    hh: 12,
    col: PLT,
    skipBox: true,
    nohit: 1,
    cond: barOn,
    f: (P, F) => {
      const K = RP(PLT);
      P.r(F.x, F.y, F.w, F.h, K[3]).r(F.x, F.y, F.w, 1, K[4]).r(F.x, F.y + F.h - 1, F.w, 1, K[1]);
    },
    b: (P, F) => {
      const K = RP(PLT);
      P.r(F.x, F.y, F.w, F.h, K[2]);
    },
    s: (P, F) => {
      const K = RP(PLT), cx = F.x + Math.round(F.w / 2), cy = F.y + Math.round(F.h / 2), r = Math.max(2, Math.min(Math.round(F.w / 2), Math.round(F.h / 2)));
      P.oval(cx, cy, r, r, K[1]).oval(cx, cy, r - 1, r - 1, K[3]).ring(cx, cy, Math.max(1, r - 3), Math.max(1, r - 3), K[2]).oval(cx, cy, 1, 1, "#6a6e74");
    },
    t: (P, T) => {
      P.r(T.x, T.y, T.w, T.h, RP(PLT)[4]);
    }
  });
  build("barbell", {
    front: true,
    pad: 2,
    tpu: 14,
    sh: .36,
    col: IRONB,
    parts: [ {
      x: .44,
      y: .28,
      w: .12,
      d: .06,
      z: 0,
      hh: 6,
      noTop: 1,
      metal: 1
    }, {
      x: .44,
      y: .86,
      w: .12,
      d: .06,
      z: 0,
      hh: 6,
      noTop: 1,
      metal: 1
    }, {
      x: .47,
      y: .3,
      w: .06,
      d: .6,
      z: 3,
      hh: 3,
      noTop: 1,
      metal: 1,
      nohit: 1
    }, {
      x: .41,
      y: .26,
      w: .18,
      d: .68,
      z: 6,
      hh: 4,
      col: "#7a2a2a",
      all: (P, F) => {
        const W = RP("#7a2a2a");
        P.r(F.x, F.y, F.w, 1, W[5]);
      },
      t: (P, T) => {
        const W = RP("#7a2a2a");
        P.r(T.x, T.y, T.w, T.h, W[4]);
        P.r(T.x, T.y, T.w, 1, W[5]);
        const sm = T.put(0, .3, 1, .02);
        P.r(sm.x, sm.y, sm.w, Math.max(1, sm.h), W[2]);
      }
    }, {
      x: .3,
      y: .08,
      w: .14,
      d: .22,
      z: 0,
      hh: 2,
      noTop: 1,
      metal: 1
    }, {
      x: .56,
      y: .08,
      w: .14,
      d: .22,
      z: 0,
      hh: 2,
      noTop: 1,
      metal: 1
    }, {
      x: .35,
      y: .14,
      w: .03,
      d: .06,
      z: 2,
      hh: 20,
      noTop: 1,
      metal: 1
    }, {
      x: .62,
      y: .14,
      w: .03,
      d: .06,
      z: 2,
      hh: 20,
      noTop: 1,
      metal: 1
    }, {
      x: .03,
      y: .17,
      w: .94,
      d: .03,
      z: 19,
      hh: 2,
      col: "#8a8e94",
      metal: 1,
      nohit: 1,
      cond: barOn
    }, bpPlate(.08), bpPlate(.12), bpPlate(.85), bpPlate(.89) ]
  });
  const OPM = "#a8b0b4";
  build("opTable", {
    front: true,
    pad: 3,
    tpu: 24,
    sh: .4,
    col: OPM,
    parts: [ {
      x: .2,
      y: .42,
      w: .6,
      d: .18,
      z: 0,
      hh: 3,
      col: "#8a9298"
    }, {
      x: .38,
      y: .46,
      w: .24,
      d: .1,
      z: 3,
      hh: 12,
      noTop: 1,
      col: "#8a9298"
    }, {
      x: .08,
      y: .03,
      w: .84,
      d: .94,
      z: 15,
      hh: 3,
      metal: 1,
      t: (P, T, g) => {
        const Rp = RP("#4f8a86");
        for (const [a, b] of [ [ .03, .2 ], [ .23, .6 ], [ .63, .97 ] ]) {
          const q = T.put(.06, a, .88, b - a);
          P.r(q.x, q.y, q.w, q.h, Rp[3]).r(q.x, q.y, q.w, 1, Rp[5]).r(q.x, q.y + q.h - 1, q.w, 1, Rp[1]);
        }
        const st = T.put(0, .45, 1, .04);
        P.r(st.x, st.y, st.w, Math.max(1, st.h), "#2a2c30");
        if (T.v % 2 === 0) {
          const bl = T.put(.35, .38, .3, .14);
          P.oval(bl.x + Math.round(bl.w / 2), bl.y + Math.round(bl.h / 2), Math.max(1, Math.round(bl.w / 2)), Math.max(1, Math.round(bl.h / 2)), "#6a1a1e");
        }
      }
    }, {
      x: .9,
      y: .46,
      w: .06,
      d: .06,
      z: 0,
      hh: 46,
      noTop: 1,
      col: "#c8ccd0",
      metal: 1
    }, {
      x: .5,
      y: .47,
      w: .42,
      d: .04,
      z: 44,
      hh: 2,
      noTop: 1,
      col: "#c8ccd0",
      metal: 1,
      nohit: 1
    }, {
      x: .3,
      y: .38,
      w: .4,
      d: .22,
      z: 36,
      hh: 7,
      col: "#6a7076",
      nohit: 1,
      all: (P, F) => {
        P.r(F.x + 1, F.y + F.h - 2, Math.max(1, F.w - 2), 2, "#d8dcde");
        for (let x = F.x + 2; x < F.x + F.w - 2; x += 3) P.p(x, F.y + F.h - 1, "#fff8d8");
      },
      t: (P, T) => {
        P.r(T.x, T.y, T.w, T.h, "#8a9096");
        P.r(T.x + Math.round(T.w / 2) - 1, T.y + Math.round(T.h / 2) - 1, 3, 3, "#c8ccd0");
      }
    } ]
  });
})(window.SX);
