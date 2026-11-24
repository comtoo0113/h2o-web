"use strict";

(function(SX) {
  const S = SX.audio = {
    ctx: null,
    master: null,
    sfxBus: null,
    ambBus: null,
    ok: false,
    listener: {
      x: 0,
      y: 0,
      inside: false
    }
  };
  let noiseBuf = null;
  S.underwater = function(on) {
    on = !!on;
    if (!S.ctx || !S.master || on === !!S._uw) return;
    S._uw = on;
    if (!S.uwF) {
      S.uwF = S.ctx.createBiquadFilter();
      S.uwF.type = "lowpass";
      S.uwF.frequency.value = 380;
      S.uwF.Q.value = .8;
      S.uwF.connect(S.ctx.destination);
    }
    try {
      S.master.disconnect(on ? S.ctx.destination : S.uwF);
    } catch (e) {}
    S.master.connect(on ? S.uwF : S.ctx.destination);
  };
  S.init = function() {
    if (S.ctx) {
      if (S.ctx.state === "suspended") S.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = S.ctx = new AC;
    S.master = ctx.createGain();
    S.master.connect(ctx.destination);
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 4;
    comp.connect(S.master);
    S.sfxBus = ctx.createGain();
    S.sfxBus.connect(comp);
    S.ambBus = ctx.createGain();
    S.ambBus.connect(S.master);
    S.verb = ctx.createConvolver();
    S.verb.buffer = impulse(ctx, .9, 2.6);
    S.verbGain = ctx.createGain();
    S.verbGain.gain.value = .35;
    S.verb.connect(S.verbGain);
    S.verbGain.connect(comp);
    S.musBus = ctx.createGain();
    S.musHide = ctx.createGain();
    S.musDuck = ctx.createGain();
    S.musBus.connect(S.musHide);
    S.musHide.connect(S.musDuck);
    S.musDuck.connect(S.master);
    S.cat = {};
    S.catV = {};
    for (const k of S.CATS) {
      const g = ctx.createGain();
      g.connect(S.sfxBus);
      S.cat[k] = g;
      const vg = ctx.createGain();
      vg.connect(S.verb);
      S.catV[k] = vg;
    }
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    S.ok = true;
    S.applyVol();
    if (SX.opts.mute) S.master.gain.value = 0;
    S.loadSamples().then(startLoops);
  };
  S.applyVol = function() {
    if (!S.ok) return;
    const o = SX.opts, muted = !!o.mute, n = (v, d) => v == null || !(v >= 0) ? d : Math.min(1, +v);
    S.master.gain.value = muted ? 0 : n(o.vol, .8);
    S.sfxBus.gain.value = n(o.sfx, 1);
    S.ambBus.gain.value = n(o.amb, .8);
    S.musBus.gain.value = n(o.mus, .8);
    for (const k of S.CATS) {
      const v = n(o[S.CAT_OPT[k]], 1);
      S.cat[k].gain.value = v;
      S.catV[k].gain.value = v * n(o.sfx, 1);
    }
  };
  S.CATS = [ "gun", "step", "voice", "item", "ui" ];
  S.CAT_OPT = {
    gun: "sGun",
    step: "sStep",
    voice: "sVoice",
    item: "sItem",
    ui: "sUi"
  };
  const CAT_OF = {};
  for (const [cat, names] of Object.entries({
    gun: "pistol revolver smg rifle lmg sniper shotgun homemade suppressed enemyGun explode flashbang flashCrack flashBoom gasPop gasHiss hitWall hitMetal casing empty pin flare trapHit trapSnap trapSpring trapPry trapDown trapChain wireStretch wireClick trapLay trapArm " + "beltIn boltA boltB boltBack boltDown boltFwd boltUp breakClose breakOpen chargeBack chargeFwd coverClose coverOpen cylClose cylEject cylOpen heavyCharge heavyClose k98Close k98Open latch magIn magOut magSlap " + "pipeClose pipeOpen pmagOut ppsh rattle rattleS reload rifleCharge roundIn screw shellDrop shellEject shellIn slideBack slideFwd slideRack smgCharge tmpCharge gunClack weaponSwap",
    step: "step stair stairsDown stairsUp",
    voice: "groan hiss bite shout dogBark dogGrowl dogWhimper hurt death deathVoice sick cough exhale gymGrunt gymBreath chatter",
    ui: "click denied confirm buy beep beepHi radioOn squelch stinger beacon extract shutter radioKey radioOpen radioVoice radioRoger titleRadio",
    amb: "thunder heliLand gas gust winRattle elecSpark elecZap"
  })) for (const nm of names.split(" ")) CAT_OF[nm] = cat;
  S.catOf = name => CAT_OF[name] || (/^far_|^casing_/.test(name) ? "gun" : /^step_/.test(name) ? "step" : "item");
  function impulse(ctx, dur, decay) {
    const len = ctx.sampleRate * dur, b = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = b.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return b;
  }
  function spatial(x, y, range) {
    if (x == null) return {
      vol: 1,
      pan: 0,
      lp: 2e4,
      d: 0
    };
    const L = S.listener, dx = x - L.x, dy = y - L.y, d = Math.hypot(dx, dy);
    const vol = Math.max(0, 1 - d / (range || 30)) ** 1.6;
    const lp = d < 6 ? 2e4 : Math.max(900, 2e4 * Math.pow(6 / d, 1.7));
    return {
      vol,
      pan: Math.max(-1, Math.min(1, dx / 14)),
      lp,
      d
    };
  }
  function out(vol, pan, lp, verb, cat) {
    const ctx = S.ctx, g = ctx.createGain();
    g.gain.value = vol;
    let node = g;
    const p = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    if (p) {
      p.pan.value = pan;
      g.connect(p);
      node = p;
    }
    let last = node;
    if (lp < 19e3) {
      const f = ctx.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = lp;
      node.connect(f);
      last = f;
    }
    const live = !!(S.cat && S.cat.item && S.cat.item.context === ctx);
    if (live && cat === "amb") last.connect(S.ambBus); else {
      last.connect(live ? S.cat[cat] || S.cat.item : S.sfxBus);
      if (verb) {
        const vd = live ? S.catV[cat] || S.catV.item : S.verb;
        if (verb === true || verb >= 1) last.connect(vd); else {
          const vs = ctx.createGain();
          vs.gain.value = verb;
          last.connect(vs);
          vs.connect(vd);
        }
      }
    }
    return g;
  }
  const R = (a, b) => a + Math.random() * (b - a);
  const E = 1e-4;
  function noise(dest, t, dur, type, freq, q, a, rel) {
    const ctx = S.ctx, src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = type || "lowpass";
    f.frequency.value = freq || 2e3;
    f.Q.value = q || .7;
    const g = ctx.createGain();
    g.gain.setValueAtTime(E, t);
    g.gain.exponentialRampToValueAtTime(Math.max(E * 2, a), t + .004);
    g.gain.exponentialRampToValueAtTime(E, t + (rel || dur));
    src.connect(f);
    f.connect(g);
    g.connect(dest);
    src.start(t, Math.random());
    src.stop(t + dur + .05);
    return f;
  }
  function sweep(dest, t, dur, f0, f1, q, a, type) {
    const f = noise(dest, t, dur, type || "bandpass", f0, q, a, dur);
    f.frequency.setValueAtTime(f0, t);
    f.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t + dur);
    return f;
  }
  function tone(dest, t, dur, type, f0, f1, a) {
    const ctx = S.ctx, o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(E, t);
    g.gain.exponentialRampToValueAtTime(Math.max(E * 2, a), t + .005);
    g.gain.exponentialRampToValueAtTime(E, t + dur);
    o.connect(g);
    g.connect(dest);
    o.start(t);
    o.stop(t + dur + .05);
  }
  const MODES = [ [ 1, 1 ], [ 2.76, .55 ], [ 5.4, .32 ], [ 8.93, .16 ] ];
  function ring(dest, t, f, a, dec, n) {
    const ctx = S.ctx;
    for (let i = 0; i < (n || 4); i++) {
      const fr = f * MODES[i][0] * R(.985, 1.015);
      if (fr > 16e3) break;
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = fr;
      const g = ctx.createGain(), d = dec / (1 + i * .7);
      g.gain.setValueAtTime(E, t);
      g.gain.exponentialRampToValueAtTime(Math.max(E * 2, a * MODES[i][1]), t + .002);
      g.gain.exponentialRampToValueAtTime(E, t + d);
      o.connect(g);
      g.connect(dest);
      o.start(t);
      o.stop(t + d + .03);
    }
  }
  function tick(dest, t, f, a) {
    noise(dest, t, .012, "bandpass", f, 2.5, a, .012);
    ring(dest, t, f * .8, a * .45, .028, 3);
  }
  function thud(dest, t, f, a, dur) {
    dur = dur || .1;
    tone(dest, t, dur, "sine", f, f * .55, a);
    noise(dest, t, dur * .8, "lowpass", f * 3.2, .7, a * .8, dur * .8);
  }
  function creak(dest, t, dur, f, a, band) {
    const ctx = S.ctx, o = ctx.createOscillator();
    o.type = "sawtooth";
    const n = 24, curve = new Float32Array(n);
    let v = f;
    for (let i = 0; i < n; i++) {
      v = Math.max(f * .6, Math.min(f * 1.6, v * R(.9, 1.12)));
      curve[i] = v;
    }
    o.frequency.setValueCurveAtTime(curve, t, dur);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = band || 1100;
    bp.Q.value = 6;
    const bp2 = ctx.createBiquadFilter();
    bp2.type = "bandpass";
    bp2.frequency.value = (band || 1100) * 2.1;
    bp2.Q.value = 5;
    const g = ctx.createGain();
    g.gain.setValueAtTime(E, t);
    g.gain.linearRampToValueAtTime(a, t + dur * .25);
    g.gain.linearRampToValueAtTime(a * .6, t + dur * .7);
    g.gain.linearRampToValueAtTime(E, t + dur);
    o.connect(bp);
    o.connect(bp2);
    bp.connect(g);
    bp2.connect(g);
    g.connect(dest);
    o.start(t);
    o.stop(t + dur + .05);
  }
  function rattle(dest, t, n, span, f0, f1, a) {
    for (let i = 0; i < n; i++) tick(dest, t + Math.random() * span, R(f0, f1), a * R(.5, 1));
  }
  function stepSurf(d, t, surf, w, pt) {
    const a = .18 + .3 * w, p = pt * R(.9, 1.1);
    if (surf === "wood") {
      noise(d, t, .07, "bandpass", 420 * p, 1.6, a, .07);
      tone(d, t, .07, "sine", 170 * p, 110 * p, a * .6);
      noise(d, t + .055, .04, "bandpass", 700 * p, 1.4, a * .4, .04);
      if (Math.random() < .08) creak(d, t + .02, .18, 120, a * .12, 900);
    } else if (surf === "tile") {
      noise(d, t, .035, "bandpass", 1900 * p, 2, a * .9, .035);
      ring(d, t, 2300 * p, a * .12, .04, 2);
      tone(d, t, .04, "sine", 140 * p, 90, a * .35);
      noise(d, t + .05, .025, "bandpass", 2600 * p, 2, a * .35, .025);
    } else if (surf === "carpet") {
      noise(d, t, .07, "lowpass", 450 * p, .8, a * .7, .07);
      noise(d, t + .05, .05, "lowpass", 380 * p, .8, a * .35, .05);
    } else if (surf === "grass") {
      noise(d, t, .1, "highpass", 2600 * p, .8, a * .5, .1);
      noise(d, t + .01, .07, "bandpass", 900 * p, 1, a * .4, .07);
      noise(d, t + .06, .06, "highpass", 3200 * p, .8, a * .3, .06);
    } else if (surf === "water") {
      noise(d, t, .2, "bandpass", 1200 * p, .9, a * .8, .2);
      tone(d, t + .01, .07, "sine", 700 * p, 320, a * .25);
      noise(d, t + .03, .14, "highpass", 3600, .7, a * .35, .14);
    } else {
      noise(d, t, .05, "bandpass", 1100 * p, 1.4, a, .05);
      tone(d, t, .045, "sine", 115 * p, 70, a * .5);
      noise(d, t + .05, .03, "highpass", 2600 * p, 1, a * .35, .03);
    }
  }
  function shot(d, t, c, o) {
    const far = o.far || 0, k = 1 - far * .85;
    if (c.crack && k > .1) noise(d, t, c.crack[1], "highpass", c.crack[0], .7, c.crack[2] * k, c.crack[1]);
    noise(d, t, c.body[1], "lowpass", c.body[0], .7, c.body[2], c.body[1]);
    tone(d, t, c.boom[2], "sine", c.boom[0], c.boom[1], c.boom[3]);
    if (c.tail) noise(d, t + .012, c.tail[1] * (1 + far), "bandpass", c.tail[0], .9, c.tail[2] * (1 + far * .5), c.tail[1] * (1 + far));
    if (c.mech && k > .3) tick(d, t + c.mech[1], c.mech[0] * R(.95, 1.05), c.mech[2] * k);
    if (c.echo && far < .9) noise(d, t + c.echo[0], c.echo[1], "lowpass", c.echo[2], .6, c.echo[3], c.echo[1]);
  }
  const SHOT = {
    pistol: {
      crack: [ 2600, .02, .8 ],
      body: [ 3e3, .18, .85 ],
      boom: [ 175, 55, .12, .5 ],
      tail: [ 800, .35, .22 ],
      mech: [ 3100, .025, .14 ]
    },
    revolver: {
      crack: [ 2200, .025, .9 ],
      body: [ 2400, .3, 1 ],
      boom: [ 125, 40, .2, .7 ],
      tail: [ 700, .5, .28 ]
    },
    smg: {
      crack: [ 2900, .015, .75 ],
      body: [ 3600, .11, .8 ],
      boom: [ 205, 70, .08, .42 ],
      tail: [ 900, .25, .18 ],
      mech: [ 2600, .02, .2 ]
    },
    rifle: {
      crack: [ 3e3, .025, 1 ],
      body: [ 4300, .22, 1 ],
      boom: [ 140, 40, .16, .6 ],
      tail: [ 600, .5, .3 ],
      mech: [ 2200, .03, .12 ]
    },
    lmg: {
      crack: [ 2800, .025, .95 ],
      body: [ 3800, .24, 1 ],
      boom: [ 110, 34, .19, .75 ],
      tail: [ 520, .55, .32 ],
      mech: [ 1700, .03, .2 ]
    },
    sniper: {
      crack: [ 3400, .03, 1 ],
      body: [ 5e3, .35, 1 ],
      boom: [ 90, 28, .35, .9 ],
      tail: [ 450, 1.1, .34 ],
      echo: [ .28, .6, 700, .18 ]
    },
    shotgun: {
      crack: [ 2e3, .02, .6 ],
      body: [ 2e3, .45, 1 ],
      boom: [ 82, 28, .3, .9 ],
      tail: [ 380, .75, .35 ]
    },
    homemade: {
      crack: [ 1800, .02, .5 ],
      body: [ 1700, .28, .9 ],
      boom: [ 120, 45, .18, .6 ],
      tail: [ 500, .4, .22 ]
    }
  };
  S.SHOT = SHOT;
  const P = o => o && o.p || 1;
  const PARTS = {
    magOut(d, t, o) {
      const p = P(o);
      tick(d, t, 3200 * p, .35);
      sweep(d, t + .02, .1, 1900 * p, 850 * p, 2, .22);
      noise(d, t + .16, .08, "bandpass", 1300, .8, .08, .08);
    },
    magIn(d, t, o) {
      const p = P(o);
      sweep(d, t, .07, 900 * p, 1700 * p, 2, .18);
      ring(d, t + .07, 1150 * p, .45, .07);
      tick(d, t + .07, 2600 * p, .4);
      thud(d, t + .07, 220 * p, .3, .06);
    },
    magSlap(d, t, o) {
      const p = P(o);
      PARTS.magIn(d, t, o);
      thud(d, t + .1, 150 * p, .45, .07);
      tick(d, t + .1, 2e3 * p, .2);
    },
    slideBack(d, t, o) {
      const p = P(o);
      tick(d, t, 2200 * p, .3);
      sweep(d, t + .01, .06, 2600 * p, 1500 * p, 1.5, .15, "highpass");
      ring(d, t + .06, 1800 * p, .2, .04);
    },
    slideFwd(d, t, o) {
      const p = P(o);
      tick(d, t, 3500 * p, .5);
      ring(d, t, 2400 * p, .45, .09);
      thud(d, t, 320 * p, .22, .05);
    },
    chargeBack(d, t, o) {
      const p = P(o);
      tick(d, t, 1600 * p, .35);
      sweep(d, t + .01, .09, 1400 * p, 2300 * p, 1.8, .16);
    },
    chargeFwd(d, t, o) {
      const p = P(o);
      ring(d, t, 1300 * p, .55, .12);
      tick(d, t, 3e3 * p, .45);
      thud(d, t, 180 * p, .35, .07);
    },
    boltUp(d, t, o) {
      const p = P(o);
      tick(d, t, 1400 * p, .3);
      ring(d, t, 900 * p, .22, .05);
    },
    boltBack(d, t, o) {
      const p = P(o);
      sweep(d, t, .12, 1e3 * p, 1900 * p, 1.6, .18);
      ring(d, t + .12, 1600 * p, .3, .05);
    },
    boltFwd(d, t, o) {
      const p = P(o);
      sweep(d, t, .1, 1900 * p, 1e3 * p, 1.6, .18);
      ring(d, t + .1, 1100 * p, .45, .07);
      tick(d, t + .1, 2400 * p, .3);
    },
    boltDown(d, t, o) {
      const p = P(o);
      tick(d, t, 2e3 * p, .45);
      thud(d, t, 210 * p, .3, .05);
    },
    cylOpen(d, t, o) {
      const p = P(o);
      tick(d, t, 2800 * p, .35);
      ring(d, t, 2e3 * p, .2, .05);
      for (let i = 0; i < 5; i++) tick(d, t + .05 + i * .022, 4200 * p, .12 * (1 - i * .15));
    },
    cylEject(d, t, o) {
      const n = o && o.n || 6;
      tick(d, t, 1800, .3);
      for (let i = 0; i < n; i++) {
        const tt = t + .12 + Math.random() * .25;
        ring(d, tt, R(3600, 5600), R(.07, .14), .14, 3);
        ring(d, tt + R(.04, .08), R(3800, 5400), .05, .08, 2);
      }
    },
    roundIn(d, t, o) {
      const p = P(o), n = o && o.n || 1;
      for (let i = 0; i < n; i++) {
        const tt = t + i * .13;
        tick(d, tt, 2400 * p * R(.95, 1.05), .22);
        ring(d, tt, 1700 * p, .12, .03);
      }
    },
    cylClose(d, t, o) {
      const p = P(o);
      tick(d, t, 1800 * p, .5);
      ring(d, t, 1400 * p, .4, .08);
      for (let i = 0; i < 4; i++) tick(d, t + .08 + i * .03, 3800 * p, .1);
    },
    breakOpen(d, t, o) {
      const p = P(o);
      tick(d, t, 1200 * p, .5);
      ring(d, t, 700 * p, .4, .12);
      creak(d, t + .03, .12, 180 * p, .05, 1300);
    },
    shellEject(d, t, o) {
      const n = o && o.n || 2;
      noise(d, t, .03, "bandpass", 1200, 1, .45, .03);
      tone(d, t, .05, "sine", 420, 200, .2);
      for (let i = 0; i < n; i++) {
        const tt = t + .22 + i * .09 + Math.random() * .05;
        thud(d, tt, 380, .12, .04);
        ring(d, tt, R(2500, 3e3), .06, .06, 2);
      }
    },
    shellIn(d, t, o) {
      const p = P(o);
      sweep(d, t, .06, 700 * p, 1300 * p, 1.4, .16);
      thud(d, t + .06, 260 * p, .28, .05);
      ring(d, t + .06, 900 * p, .18, .05);
    },
    breakClose(d, t, o) {
      const p = P(o);
      ring(d, t, 800 * p, .6, .1);
      tick(d, t, 2e3 * p, .6);
      thud(d, t, 160 * p, .5, .08);
    },
    coverOpen(d, t, o) {
      const p = P(o);
      tick(d, t, 1100 * p, .45);
      ring(d, t, 600 * p, .45, .2);
      creak(d, t + .04, .15, 140, .05, 1e3);
    },
    beltIn(d, t, o) {
      const n = o && o.n || 9;
      for (let i = 0; i < n; i++) tick(d, t + i * R(.022, .034), R(3e3, 4500), .13);
      ring(d, t + n * .03, 700, .25, .08);
    },
    coverClose(d, t, o) {
      const p = P(o);
      ring(d, t, 500 * p, .7, .15);
      thud(d, t, 120 * p, .6, .1);
      tick(d, t, 1500 * p, .4);
    },
    rattle(d, t, o) {
      rattle(d, t, 6, .14, 1400, 3200, .25);
      ring(d, t + .05, R(600, 900), .15, .1);
    },
    pipeOpen(d, t, o) {
      creak(d, t, .28, 70, .1, 700);
      rattle(d, t, 4, .25, 1200, 2400, .18);
    },
    pipeClose(d, t, o) {
      thud(d, t, 190, .45, .07);
      tick(d, t, 1600, .35);
      rattle(d, t + .03, 3, .08, 1500, 2600, .15);
    }
  };
  const SEQ = {
    pistol: [ [ .12, "pmagOut" ], [ .62, "magIn", {
      r: 1.18,
      v: .8
    } ], [ .92, "slideRack", {
      empty: 1
    } ] ],
    revolver: [ [ .08, "cylOpen" ], [ .2, "cylEject" ], [ .45, "roundIn" ], [ .6, "roundIn" ], [ .72, "roundIn" ], [ .93, "cylClose" ] ],
    smg: [ [ .12, "magOut", {
      r: 1.06
    } ], [ .55, "magIn", {
      r: 1.06
    } ], [ .9, "smgCharge", {
      empty: 1
    } ] ],
    rifle: [ [ .12, "magOut" ], [ .55, "magSlap" ], [ .9, "rifleCharge", {
      empty: 1
    } ] ],
    lmg: [ [ .08, "coverOpen" ], [ .25, "magOut", {
      r: .85
    } ], [ .48, "magIn", {
      r: .82,
      v: 1
    } ], [ .6, "beltIn" ], [ .74, "heavyClose", {
      r: .8
    } ], [ .92, "heavyCharge", {
      empty: 1,
      r: .9
    } ] ],
    sniper: [ [ .1, "boltA" ], [ .35, "magOut", {
      r: .95
    } ], [ .64, "magIn", {
      r: .95
    } ], [ .9, "boltB" ] ],
    shotgun: [ [ .08, "latch", {
      r: .85
    } ], [ .2, "shellDrop" ], [ .48, "shellIn" ], [ .68, "shellIn" ], [ .92, "heavyClose", {
      r: .9
    } ] ]
  };
  const SEQ_NAME = {
    "K13 소음권총": [ [ .12, "pmagOut", {
      r: 1.05
    } ], [ .62, "magIn", {
      r: 1.25,
      v: .7
    } ], [ .92, "slideRack", {
      empty: 1,
      r: 1.08
    } ] ],
    "K7 소음기관단총": [ [ .12, "magOut", {
      r: 1.1
    } ], [ .55, "magSlap", {
      r: 1.1
    } ], [ .9, "tmpCharge", {
      empty: 1
    } ] ],
    "M16A1 소총": [ [ .12, "magOut", {
      r: .97
    } ], [ .55, "magSlap", {
      r: .97
    } ], [ .9, "rifleCharge", {
      empty: 1,
      r: .94
    } ] ],
    "K2 소총": [ [ .12, "magOut" ], [ .55, "magSlap" ], [ .9, "heavyCharge", {
      empty: 1,
      r: 1.12,
      v: .8
    } ] ],
    "USAS-12 산탄총": [ [ .12, "magOut", {
      r: .8
    } ], [ .55, "magSlap", {
      r: .8
    } ], [ .9, "heavyCharge", {
      empty: 1
    } ] ],
    "사제 파이프 권총": [ [ .12, "screw" ], [ .4, "casing" ], [ .62, "roundIn" ], [ .9, "latch", {
      r: 1.2
    } ] ],
    "사제 산탄총": [ [ .08, "latch", {
      r: .78
    } ], [ .16, "rattleS" ], [ .25, "shellDrop" ], [ .58, "shellIn" ], [ .9, "heavyClose", {
      r: .85
    } ], [ .94, "rattleS" ] ],
    "사제 기관단총": [ [ .12, "magOut", {
      r: .9
    } ], [ .2, "rattleS" ], [ .55, "magIn", {
      r: .9
    } ], [ .9, "ppsh", {
      empty: 1
    } ] ],
    "사제 사냥총": [ [ .1, "k98Open" ], [ .35, "casing" ], [ .58, "roundIn" ], [ .88, "k98Close" ] ]
  };
  S.RELOAD_SEQ = SEQ;
  S.RELOAD_NAME = SEQ_NAME;
  S.reloadSeq = function(g, empty, dur) {
    if (!g) return [];
    const base = SEQ_NAME[g.name] || SEQ[g.cls] || SEQ.pistol, out2 = [];
    const miss = Math.max(1, (g.magSize || 1) - (g.ammo || 0));
    let shells = 0;
    for (const [at, s, o] of base) {
      if (s === "shellIn" && g.cls === "shotgun" && !SEQ_NAME[g.name] && ++shells > miss) continue;
      const oo = Object.assign({}, o || {});
      delete oo.empty;
      let a = at;
      if (dur) a = Math.max(0, at - S.hitOf(s) / (oo.r || 1) / dur);
      out2.push({
        at: a,
        s,
        o: oo
      });
    }
    out2.sort((x, y) => x.at - y.at);
    return out2;
  };
  const LIB = Object.assign({
    pistol(d, t, o) {
      shot(d, t, SHOT.pistol, o);
    },
    revolver(d, t, o) {
      shot(d, t, SHOT.revolver, o);
    },
    smg(d, t, o) {
      shot(d, t, SHOT.smg, o);
    },
    rifle(d, t, o) {
      shot(d, t, SHOT.rifle, o);
    },
    lmg(d, t, o) {
      shot(d, t, SHOT.lmg, o);
    },
    sniper(d, t, o) {
      shot(d, t, SHOT.sniper, o);
    },
    shotgun(d, t, o) {
      shot(d, t, SHOT.shotgun, o);
    },
    homemade(d, t, o) {
      shot(d, t, SHOT.homemade, o);
      rattle(d, t + .03, 3, .06, 1500, 2600, .15 * (1 - (o.far || 0)));
    },
    suppressed(d, t, o) {
      noise(d, t, .07, "bandpass", 1100, 1.1, .6, .07);
      tone(d, t, .06, "sine", 320, 120, .3);
      noise(d, t, .03, "highpass", 3500, .7, .12, .03);
      if (!o.far) {
        tick(d, t + .012, 2300, .35);
        ring(d, t + .012, 1500, .14, .05);
      }
    },
    enemyGun(d, t, o) {
      shot(d, t, SHOT.pistol, o);
    },
    empty(d, t) {
      tick(d, t, 2500, .35);
      ring(d, t, 1800, .12, .03);
    },
    reload(d, t) {
      tick(d, t, 2400, .3);
      ring(d, t + .02, 1500, .2, .05);
      tick(d, t + .18, 1800, .35);
      ring(d, t + .18, 1100, .3, .07);
    },
    casing(d, t) {
      let a = .1, tt = t;
      for (let i = 0; i < 3; i++) {
        ring(d, tt, R(4200, 6200), a, .09, 3);
        tt += R(.05, .09) * (1 - i * .3);
        a *= .5;
      }
    },
    brick(d, t) {
      thud(d, t, 160, .5, .08);
      noise(d, t, .06, "bandpass", 1500, 1, .3, .06);
      rattle(d, t + .04, 3, .1, 800, 1600, .12);
    },
    step(d, t, o) {
      const w = o.w == null ? .5 : o.w, surf = o.surface || "conc";
      if (o.kind === "zombie") {
        sweep(d, t, .2, 500, 900, 1.2, .16 + .1 * w);
        stepSurf(d, t + .12, surf, w * .5, .9);
        return;
      }
      if (o.kind === "dog") {
        noise(d, t, .02, "bandpass", 1500, 2, .12, .02);
        noise(d, t + .06, .02, "bandpass", 1700, 2, .1, .02);
        return;
      }
      stepSurf(d, t, surf, w, o.kind === "boot" ? .85 : 1);
    },
    stairsUp(d, t) {
      for (let i = 0; i < 6; i++) {
        const tt = t + i * R(.34, .39);
        stepSurf(d, tt, "conc", .7, .86 + i * .015);
        noise(d, tt + .02, .07, "lowpass", 260, .7, .07, .07);
      }
    },
    stairsDown(d, t) {
      for (let i = 0; i < 6; i++) {
        const tt = t + i * R(.27, .31);
        stepSurf(d, tt, "conc", .62, .95 - i * .015);
      }
    },
    melee(d, t) {
      sweep(d, t, .16, 500, 2200, 1.2, .3);
    },
    swing(d, t) {
      sweep(d, t, .2, 400, 1800, 1, .22);
    },
    punch(d, t) {
      tone(d, t, .08, "sine", 110, 60, .6);
      noise(d, t, .07, "lowpass", 700, .8, .6, .07);
      noise(d, t, .02, "bandpass", 1800, 1, .2, .02);
    },
    hitFlesh(d, t) {
      noise(d, t, .1, "lowpass", 900 * R(.85, 1.15), 1, .6, .1);
      tone(d, t, .08, "sine", 120 * R(.9, 1.1), 60, .4);
      noise(d, t + .01, .05, "bandpass", 500, 2, .25, .05);
    },
    hitWall(d, t, o) {
      noise(d, t, .06, "highpass", 2500, 1, .35, .06);
      ring(d, t, R(2300, 2900), .08, .05, 2);
      noise(d, t + .01, .12, "lowpass", 1200, .8, .12, .12);
      if (!o.hi && Math.random() < .15) tone(d, t + .02, .25, "sine", R(2400, 3e3), R(800, 1e3), .06);
    },
    hurt(d, t) {
      tone(d, t, .2, "sawtooth", 240, 90, .35);
      noise(d, t, .12, "lowpass", 800, 1, .4, .12);
    },
    groan(d, t) {
      const ctx = S.ctx, o = ctx.createOscillator();
      o.type = "sawtooth";
      const b = 80 + Math.random() * 40;
      o.frequency.setValueAtTime(b, t);
      o.frequency.linearRampToValueAtTime(b * .7, t + .9);
      const f = ctx.createBiquadFilter();
      f.type = "bandpass";
      f.frequency.value = 500;
      f.Q.value = 3;
      const g = ctx.createGain();
      g.gain.setValueAtTime(1e-4, t);
      g.gain.linearRampToValueAtTime(.25, t + .2);
      g.gain.linearRampToValueAtTime(1e-4, t + 1);
      o.connect(f);
      f.connect(g);
      g.connect(d);
      o.start(t);
      o.stop(t + 1.05);
    },
    shout(d, t) {
      const ctx = S.ctx, o = ctx.createOscillator();
      o.type = "square";
      o.frequency.setValueAtTime(190, t);
      o.frequency.linearRampToValueAtTime(260, t + .1);
      o.frequency.linearRampToValueAtTime(170, t + .35);
      const f = ctx.createBiquadFilter();
      f.type = "bandpass";
      f.frequency.value = 1100;
      f.Q.value = 2;
      const g = ctx.createGain();
      g.gain.setValueAtTime(1e-4, t);
      g.gain.linearRampToValueAtTime(.18, t + .03);
      g.gain.linearRampToValueAtTime(1e-4, t + .38);
      o.connect(f);
      f.connect(g);
      g.connect(d);
      o.start(t);
      o.stop(t + .4);
    },
    doorOpen(d, t) {
      tick(d, t, 2200, .3);
      ring(d, t, 1600, .16, .05);
      tick(d, t + .08, 1800, .28);
      if (Math.random() < .7) creak(d, t + .1, R(.3, .5), R(95, 140), .07, R(900, 1300));
      noise(d, t + .1, .3, "lowpass", 600, .7, .07, .3);
    },
    doorClose(d, t) {
      noise(d, t, .2, "lowpass", 500, .7, .08, .2);
      thud(d, t + .17, 90, .6, .15);
      noise(d, t + .17, .12, "lowpass", 420, .8, .45, .12);
      tick(d, t + .18, 2e3, .35);
      ring(d, t + .18, 1400, .15, .05);
    },
    door(d, t) {
      LIB.doorOpen(d, t);
    },
    doorLocked(d, t) {
      for (let i = 0; i < 3; i++) {
        tick(d, t + i * .08, i % 2 ? 1700 : 1400, .28);
        thud(d, t + i * .08, 200, .12, .04);
      }
    },
    doorBash(d, t) {
      thud(d, t, 70, 1, .3);
      noise(d, t, .15, "bandpass", 1500, .8, .7, .15);
      rattle(d, t + .03, 5, .2, 2500, 5e3, .2);
      noise(d, t + .05, .4, "lowpass", 300, .6, .3, .4);
    },
    keyTurn(d, t) {
      for (let i = 0; i < 3; i++) ring(d, t + i * .05 + Math.random() * .02, R(3200, 5200), .06, .05, 2);
      tick(d, t + .5, 1300, .4);
    },
    gateUnlock(d, t) {
      for (let i = 0; i < 4; i++) ring(d, t + i * .04 + Math.random() * .02, R(3e3, 5e3), .07, .06, 2);
      tick(d, t + .25, 1200, .45);
      ring(d, t + .25, 900, .25, .06);
      creak(d, t + .4, .45, 150, .08, 1800);
      ring(d, t + .88, 480, .55, .3);
      thud(d, t + .88, 130, .4, .1);
    },
    locked(d, t) {
      rattle(d, t, 10, .3, 2500, 4500, .18);
      ring(d, t + .02, 800, .2, .12);
      thud(d, t, 180, .2, .05);
    },
    pickup(d, t) {
      noise(d, t, .05, "bandpass", 1500, 1, .1, .05);
      tone(d, t, .05, "square", 660, 880, .08);
    },
    rustle(d, t) {
      for (let i = 0; i < 5; i++) noise(d, t + i * R(.04, .07), R(.04, .08), "bandpass", R(1500, 4e3), 1, R(.06, .12), .06);
    },
    click(d, t) {
      tone(d, t, .03, "square", 1200, 900, .08);
    },
    denied(d, t) {
      tone(d, t, .12, "square", 220, 180, .15);
    },
    buy(d, t) {
      tone(d, t, .06, "square", 880, 880, .12);
      tone(d, t + .07, .1, "square", 1320, 1320, .12);
    },
    beep(d, t, o) {
      tone(d, t, .08, "square", o.hi ? 1320 : 880, null, .14);
    },
    explode(d, t) {
      noise(d, t, 1.6, "lowpass", 900, .5, 1, 1.5);
      tone(d, t, .6, "sine", 70, 25, 1);
      noise(d, t, .15, "highpass", 2e3, .5, .6, .15);
      rattle(d, t + .3, 8, .8, 1500, 4e3, .1);
    },
    pin(d, t) {
      tone(d, t, .05, "triangle", 2400, 2e3, .15);
      ring(d, t + .1, 3200, .1, .05, 2);
    },
    flare(d, t) {
      noise(d, t, 1.8, "bandpass", 1800, .6, .5, 1.8);
      tone(d, t, .3, "sawtooth", 300, 900, .2);
    },
    gas(d, t) {
      tone(d, t, 1.2, "sine", 60, 45, .4);
      noise(d, t, 1.2, "lowpass", 300, .5, .3, 1.2);
    },
    zip(d, t) {
      noise(d, t, 2.2, "bandpass", 3e3, 3, .3, 2.2);
      tone(d, t, 2.2, "sawtooth", 500, 1400, .06);
    },
    heal(d, t) {
      tone(d, t, .15, "sine", 520, 780, .15);
      tone(d, t + .12, .2, "sine", 780, 1040, .12);
    },
    extract(d, t) {
      [ 523, 659, 784, 1046 ].forEach((f, i) => tone(d, t + i * .1, .3, "square", f, null, .1));
    },
    death(d, t) {
      tone(d, t, 1.4, "sawtooth", 200, 40, .3);
      noise(d, t, 1.2, "lowpass", 500, .5, .3, 1.2);
    },
    bleed(d, t) {
      noise(d, t, .18, "lowpass", 700, .8, .45, .18);
      tone(d, t + .05, .25, "sine", 90, 55, .35);
      tone(d, t + .38, .22, "sine", 85, 50, .3);
    },
    bone(d, t) {
      noise(d, t, .06, "highpass", 2500, 1.2, .7, .06);
      noise(d, t + .04, .12, "bandpass", 900, 2, .5, .12);
      tone(d, t, .2, "square", 160, 70, .12);
    },
    sick(d, t) {
      tone(d, t, .6, "sine", 220, 150, .12);
      tone(d, t + .1, .6, "sine", 233, 160, .08);
    },
    beacon(d, t) {
      tone(d, t, .09, "square", 1320, null, .08);
      tone(d, t + .14, .09, "square", 1320, null, .06);
    },
    thunder(d, t) {
      noise(d, t, 3.5, "lowpass", 180, .4, .9, 3.4);
      noise(d, t + .05, .4, "lowpass", 1200, .4, .5, .4);
    }
  }, PARTS);
  const V = (...a) => a.map(x => typeof x === "string" ? [ x, 1, 1 ] : [ x[0], x[1] || 1, x[2] == null ? 1 : x[2] ]);
  const BANK = {
    pistol: V("gun_pistol_1", "gun_pistol_2"),
    revolver: V("gun_revolver_1", [ "gun_revolver_1", .94 ]),
    smg: V("gun_smg_1", "gun_smg_2"),
    rifle: V("gun_rifle_1", "gun_rifle_3", [ "gun_rifle_2", 1, .9 ]),
    lmg: V("gun_lmg_2", [ "gun_lmg_1", .95 ]),
    sniper: V("gun_sniper_3", "gun_sniper_4"),
    shotgun: V("gun_shotgun_1", [ "gun_shotgun_1", .92 ]),
    homemade: V([ "gun_home_1", .9 ], "gun_home_2"),
    suppressed: V("gun_supp_1", [ "gun_supp_2", 1.1, .9 ]),
    enemyGun: V("gun_enemy_1", "gun_enemy_2"),
    far_pistol: V("far_pistol"),
    far_smg: V("far_smg"),
    far_rifle: V("far_rifle_1", "far_rifle_2"),
    far_lmg: V("far_lmg"),
    far_shotgun: V([ "far_rifle_1", .8 ]),
    magOut: V("r_magOut_1", "r_magOut_2", "r_magOut_3"),
    magIn: V([ "r_magIn_1", 1, .85 ], [ "r_magIn_2", 1, .85 ], [ "r_magIn_3", 1, .85 ], [ "r_magIn_4", 1, .85 ]),
    magSlap: V("r_magSlap_1", "r_magSlap_2", "r_magSlap_3"),
    pmagOut: V("r_pmagOut"),
    slideRack: V("r_slide_1", "r_slide_2"),
    smgCharge: V("r_smgCharge_1", "r_smgCharge_2"),
    tmpCharge: V("r_smgCharge_3"),
    ppsh: V("r_ppsh"),
    rifleCharge: V("r_rifleCharge"),
    heavyCharge: V("r_heavyCharge_1", "r_heavyCharge_2"),
    heavyClose: V("r_heavyClose"),
    boltA: V("r_boltA"),
    boltB: V("r_boltB"),
    k98Open: V("r_k98Open"),
    k98Close: V("r_k98Close"),
    coverOpen: V("r_coverOpen"),
    cylOpen: V("r_cylOpen_1", "r_cylOpen_2"),
    cylClose: V("r_cylClose_1", "r_cylClose_2"),
    shellIn: V("r_shellIn_1", "r_shellIn_2"),
    shellDrop: V("r_shellDrop_1", "r_shellDrop_2"),
    screw: V("r_screw"),
    latch: V("r_latch"),
    roundIn: V([ "round_in_1", 1, .35 ], [ "round_in_2", 1, .35 ]),
    beltIn: V([ "chain_1", 1.3, .55 ]),
    rattleS: V([ "gate_rattle", 1.5, .3 ]),
    empty: V("r_dry_1", "r_dry_2", "r_dry_3"),
    reload: V([ "r_latch", 1.2, .8 ], [ "r_slide_1", .9, .8 ]),
    secretSlide: V("secret_slide_1"),
    secretCreak: V("secret_creak_1"),
    secretClose: V("secret_slide_2"),
    doorOpen: V("door_open_1", "door_open_2", "door_open_3", "door_open_4"),
    doorClose: V("door_close_1", "door_close_2", "door_close_3", "door_close_4"),
    doorLocked: V("door_knob_1", "door_knob_2", "door_knob_3", "door_locked"),
    doorBash: V("door_bash"),
    locked: V("gate_rattle", "chain_1", "chain_2"),
    groan: V([ "zombie_1", .95 ], "zombie_2", [ "zombie_3", .9 ], "zombie_4", "zombie_5", [ "zombie_6", .92 ], "zombie_7"),
    hiss: V("zombie_hiss"),
    bite: V("zombie_bite"),
    hitFlesh: V("flesh_1", "flesh_2"),
    hitWall: V("wall_1", "wall_2", "wall_3", [ "wall_4", 1, .8 ]),
    hitMetal: V("metal_hit"),
    melee: V([ "melee_1", 1, 1.5 ], [ "melee_2", 1, 1.5 ], [ "melee_3", 1, 1.5 ]),
    swing: V("swing_1", "swing_2"),
    punch: V("gym_punch_1", "gym_punch_2", "gym_punch_3", "punch_4"),
    bone: V("crunch"),
    brick: V("brick_1", "brick_2"),
    explode: V("explode_1", "explode_2", "explode_3"),
    pickup: V("pickup_1", "pickup_2"),
    rustle: V("rustle_1", "rustle_2", "rustle_3"),
    shout: V("raider_1", "raider_2", "raider_3"),
    click: V("ui_click_1", "ui_click_2", "ui_click_3", "ui_click_4"),
    denied: V("ui_error"),
    confirm: V("ui_confirm"),
    buy: V("coins_1", "coins_2", "coins_3", "coins_4"),
    beep: V("beep_1", [ "beep_1", .9 ]),
    beepHi: V("radio_beep"),
    radioOn: V("radio_on"),
    squelch: V("radio_squelch_1", "radio_squelch_2", "radio_squelch_3"),
    chatter: V("radio_chatter"),
    radioKey: V("radio_keyup"),
    radioOpen: V("radio_open"),
    radioVoice: V("radio_voice"),
    radioRoger: V("radio_roger"),
    thunder: V("thunder_1", "thunder_2", "thunder_3"),
    heliLand: V("heli_arrive"),
    dogBark: V("dog_bark_1", [ "dog_bark_1", .92 ], "dog_bark_2"),
    dogGrowl: V("dog_growl_1", "dog_growl_2", "dog_growl_3", "dog_growl_4"),
    dogWhimper: V("dog_whimper"),
    hurt: V("pain_1", "pain_2"),
    deathVoice: V("death_voice"),
    sick: V("sick_breath"),
    bodyFall: V("body_fall"),
    stinger: V("stinger_death"),
    bandage: V("bandage_1", "bandage_2"),
    eat: V("eat_1", "eat_2", "eat_3", "eat_4"),
    drinkOpen: V("drink_open"),
    drinkPour: V("drink_pour"),
    exhale: V("exhale_1", "exhale_2"),
    zipper: V("zip_1", "zip_2", "zip_3", "zip_4"),
    paper: V("paper_1", "paper_2"),
    box: V("box_1", "box_2"),
    pin: V("pin"),
    trapSpring: V("trap_spring"),
    trapHit: V("trap_hit"),
    latchSnap: V("op_latch_1", "op_latch_2"),
    lidWood: V("op_lid"),
    drawer: V("op_drawer_1", "op_drawer_2", "op_drawer_3"),
    metalDrawer: V("op_metaldrawer_1", "op_metaldrawer_2"),
    lockerRattle: V("op_locker_1", "op_locker_2"),
    metalCreak: V("op_creak"),
    shelfMetal: V("op_shelf_1", "op_shelf_2", "op_shelf_3"),
    fridgeDoor: V([ "op_fridge_1", .92, 1 ], [ "op_fridge_2", .92, 1 ]),
    cupboard: V("op_cupboard_1", "op_cupboard_2", "op_cupboard_3"),
    buckle: V("op_buckle"),
    bottle: V("op_bottle"),
    gunClack: V("op_rack_1", "op_rack_2", "op_rack_3"),
    lockClick: V("op_lock"),
    closet: V("op_closet"),
    woodTap: V([ "wood_hit", 1.3, 1 ], [ "wood_hit", 1.45, .9 ]),
    zip: V("zipline"),
    flare: V("flare_1"),
    gas: V("gas_1"),
    weaponSwap: V([ "r_gear", 1.15, .5 ], [ "r_slide_1", .85, .35 ]),
    step_conc: V("step_conc_1", "step_conc_2", "step_conc_3", "step_conc_4", "step_conc_5", "step_conc_6", "step_conc_7", "step_conc_8"),
    step_tile: V("step_tile_1", "step_tile_2", "step_tile_3", "step_tile_4", "step_tile_5", "step_tile_6"),
    step_wood: V("step_wood_1", "step_wood_2", "step_wood_3", "step_wood_4", "step_wood_5", "step_wood_6"),
    step_carpet: V("step_carpet_1", "step_carpet_2", "step_carpet_3", "step_carpet_4", "step_carpet_5", "step_carpet_6"),
    step_grass: V("step_grass_1", "step_grass_2", "step_grass_3", "step_grass_4", "step_grass_5", "step_grass_6", "step_grass_7"),
    step_water: V("step_water_1", "step_water_2", "step_water_3", "step_water_4", "step_water_5", "step_water_6"),
    step_dog: V("step_dog_1", "step_dog_2", "step_dog_3", "step_dog_4", "step_dog_5", "step_dog_6"),
    step_drag: V("step_drag_1", "step_drag_2", "step_drag_3", "step_drag_4", "step_drag_5", "step_drag_6", "step_drag_7", "step_drag_8"),
    stair: V("stair_1", "stair_2", "stair_3", "stair_4", "stair_5", "stair_6", "stair_7", "stair_8"),
    gearRattle: V([ "r_gear", 1.1, .25 ]),
    gymBag: V("gym_bag_1", "gym_bag_2", "gym_bag_3", "gym_bag_4", "gym_bag_5", "gym_bag_6", "gym_bag_7", "gym_bag_8"),
    gymRack: V("gym_rack_1", "gym_rack_2", "gym_rack_3", "gym_rack_4"),
    gymPlate: V("gym_plate_1", "gym_plate_2", "gym_plate_3", "gym_plate_4", "gym_plate_5", "gym_plate_6"),
    gymDumbbell: V("gym_dumbbell_1", "gym_dumbbell_2", "gym_dumbbell_3", "gym_dumbbell_4"),
    gymBench: V("gym_bench_1", "gym_bench_2", "gym_bench_3", "gym_bench_4", "gym_bench_5"),
    gymDrop: V("gym_drop_1", "gym_drop_2", "gym_drop_3", "gym_drop_4", "gym_drop_5"),
    gymGrunt: V("gym_grunt_1", "gym_grunt_2", "gym_grunt_3", [ "gym_grunt_3", .92 ]),
    gymBreath: V("gym_breath_1", "gym_breath_2", "gym_breath_3", "gym_breath_4", "gym_breath_5", "gym_breath_6"),
    gymSwish: V("gym_swish", [ "gym_swish", .9 ]),
    gymSlap: V("gym_slap", [ "gym_slap", .9 ]),
    gymLand: V("gym_land", [ "gym_land", .9 ]),
    gymMotor: V("gym_motor"),
    gymBike: V("gym_bike"),
    casing_conc: V("casing_conc_1", "casing_conc_2", "casing_conc_3"),
    casing_tile: V("casing_tile_1", "casing_tile_2", "casing_tile_3"),
    casing_wood: V("casing_wood_1", "casing_wood_2", "casing_wood_3"),
    flashBoom: V([ "flash_bang_1", 1, 1.35 ], [ "flash_bang_2", 1, 1.35 ]),
    flashCrack: V([ "elec_zap_1", 1, 2 ], [ "elec_zap_1", 1.1, 2.2 ]),
    elecSpark: V([ "elec_spark_1", 1, 1 ], [ "elec_spark_1", 1.12, .9 ]),
    elecZap: V([ "elec_zap_1", 1, 1 ]),
    gasHiss: V("gas_hiss_1"),
    cough: V([ "sick_breath", 1.25, 1 ], [ "sick_breath", 1.1, .9 ]),
    fishCast: V("fish_cast_1", "fish_cast_2"),
    fishLine: V([ "fish_line", .85 ]),
    fishDrag: V([ "fish_drag_1", .85 ], [ "fish_drag_2", .85 ]),
    fishReel: V("fish_reel_1", "fish_reel_2", "fish_reel_3"),
    fishSplash: V("fish_splash", [ "fish_splash", .9 ]),
    fishFlop: V("fish_flop_1", "fish_flop_2", "fish_flop_3"),
    fishCreak: V("fish_creak_1", "fish_creak_2", "fish_creak_3"),
    fishBait: V("fish_bait"),
    gust: V("gust_1", "gust_2", "gust_3"),
    winRattle: V("win_rattle_1", "win_rattle_2", "win_rattle_3"),
    nvgOn: V("nvg_on"),
    nvgWhine: V([ "nvg_whine", .85 ]),
    nvgOff: V("nvg_off"),
    trapPry: V("trap_creak_1", "trap_creak_2"),
    trapDown: V("trap_set", [ "trap_set", .92 ]),
    trapChain: V("trap_chain"),
    wireStretch: V("wire_stretch"),
    wireClick: V("wire_set"),
    stab: V("stab_1", "stab_2"),
    potBoil: V("cook_boil"),
    stoveIgnite: V("stove_ignite"),
    chop: V("chop_1", "chop_2", "chop_3", "chop_4"),
    coolerPour: V("cooler_pour"),
    coolerGlug: V("cooler_glug_1", "cooler_glug_2"),
    drinkPour: V("drink_pour"),
    drinkGulp: V("drink_gulp_1", "drink_gulp_2", "drink_gulp_3"),
    dig: V("dig_1", "dig_2", "dig_3"),
    waterCan: V("water_can"),
    harvestLeaf: V("harvest_leaf_1", "harvest_leaf_2"),
    harvestSoil: V("harvest_soil"),
    bagCrumple: V("fold_1", "fold_2", "fold_3"),
    bagPress: V("fold_press"),
    strapPull: V("strap_1", "strap_2"),
    reviveUp: V("revive_up"),
    shutter: V("shutter"),
    plasticCrk: V("plastic_1", "plastic_2", "plastic_3", [ "plastic_2", 1.12 ]),
    waterSlosh: V("slosh_1", "slosh_2"),
    cleanSweep: V("clean_sweep_1", "clean_sweep_2", "clean_sweep_3", "clean_sweep_4"),
    cleanWipe: V("clean_wipe_1", "clean_wipe_2", "clean_wipe_3"),
    trashPaper: V("trash_paper_1", "trash_paper_2", "trash_paper_3"),
    trashCan: V("trash_can_1", "trash_can_2"),
    trashBottle: V("trash_bottle_1", [ "trash_bottle_2", 1, 1.8 ]),
    trashBag: V("trash_bag_1", "trash_bag_2", "trash_bag_3"),
    trashMisc: V("trash_misc_1", "trash_misc_2"),
    trashDump: V("trash_dump", [ "trash_dump", .92, .95 ])
  };
  const LOOPS = [ "amb_inside", "amb_night", "amb_drone", "amb_rumble", "amb_gym", "amb_vent", "amb_market", "amb_fire", "amb_city", "amb_rain_out", "amb_rain_in", "amb_wind_out", "amb_wind_in", "amb_heli", "amb_heart", "amb_river", "amb_storm", "amb_storm_in", "amb_alarm", "amb_flood" ];
  const BUF = {}, LIVE = new Set;
  let loading = null;
  S.samples = BUF;
  const CORE_KEYS = [ "click", "denied", "confirm", "buy", "beep", "beepHi", "radioOn", "squelch", "radioKey", "radioOpen", "radioVoice", "radioRoger", "pickup", "rustle", "zipper", "zip", "step_conc", "step_tile", "step_wood", "step_carpet", "step_grass", "stair", "doorOpen", "doorClose", "doorLocked", "locked", "pistol", "smg", "rifle", "shotgun", "enemyGun", "far_pistol", "far_smg", "far_rifle", "magOut", "magIn", "slideRack", "empty", "reload", "weaponSwap", "hitFlesh", "hitWall", "hurt", "groan", "bite", "swing", "punch", "melee", "bodyFall", "casing_conc" ];
  const CORE_LOOPS = [ "amb_inside", "amb_night", "amb_market", "amb_city", "amb_drone" ];
  const Q = [], QSET = new Set, CORE_F = new Set;
  let qActive = 0, qDec = null, qDone = null, coreLeft = 0, coreDone = null;
  function qPump() {
    while (Q.length && qActive < (coreLeft > 0 ? 3 : 2)) {
      const f = Q.shift();
      QSET.delete(f);
      if (BUF[f]) continue;
      if (SX.SND_HAVE && !SX.SND_HAVE.has(f)) {
        if (CORE_F.has(f) && --coreLeft === 0 && coreDone) coreDone();
        if (!Q.length && !qActive && qDone) qDone();
        continue;
      }
      qActive++;
      fetch((S.SND_BASE || "snd/") + f + ".ogg").then(r => r.ok ? r.arrayBuffer() : null).then(ab => ab && new Promise(res => {
        try {
          const pr = qDec.decodeAudioData(ab, res, () => res(null));
          if (pr && pr.catch) pr.catch(() => res(null));
        } catch (e) {
          res(null);
        }
      })).then(b => {
        if (b) {
          BUF[f] = b;
          b.hit = hitTime(b);
          if (S.ok && LOOPS.includes(f)) startLoops();
        }
      }).catch(() => {}).then(() => {
        qActive--;
        if (CORE_F.has(f) && --coreLeft === 0 && coreDone) coreDone();
        qPump();
        if (!Q.length && !qActive && qDone) qDone();
      });
    }
  }
  S.want = function(files) {
    if (!qDec) return;
    for (let i = files.length - 1; i >= 0; i--) {
      const f = files[i];
      if (BUF[f] || !QSET.has(f)) continue;
      const k = Q.indexOf(f);
      if (k > 0) {
        Q.splice(k, 1);
        Q.unshift(f);
      }
    }
    qPump();
  };
  S.loadSamples = function() {
    if (loading) return loading;
    const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!OAC || !window.fetch) return loading = Promise.resolve(0);
    qDec = new OAC(1, 1, 44100);
    const files = new Set(LOOPS);
    for (const k in BANK) for (const v of BANK[k]) files.add(v[0]);
    const core = new Set(CORE_LOOPS.filter(f => files.has(f)));
    for (const k of CORE_KEYS) for (const v of BANK[k] || []) core.add(v[0]);
    for (const f of core) if (!BUF[f]) {
      CORE_F.add(f);
      Q.push(f);
      QSET.add(f);
    }
    for (const f of files) if (!core.has(f) && !BUF[f]) {
      Q.push(f);
      QSET.add(f);
    }
    coreLeft = CORE_F.size;
    S.coreReady = coreLeft ? new Promise(r => {
      coreDone = r;
    }).then(() => {
      S.coreLoaded = Object.keys(BUF).length;
      if (S.ok) startLoops();
    }) : Promise.resolve();
    loading = (Q.length ? new Promise(r => {
      qDone = r;
    }) : Promise.resolve()).then(() => {
      S.loaded = Object.keys(BUF).length;
      if (S.ok) startLoops();
      return S.loaded;
    });
    qPump();
    return loading;
  };
  S.preload = function(files) {
    const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!OAC || !window.fetch) return Promise.resolve(0);
    const dec = new OAC(1, 1, 44100);
    return Promise.all(files.filter(f => !BUF[f] && (!SX.SND_HAVE || SX.SND_HAVE.has(f))).map(f => fetch((S.SND_BASE || "snd/") + f + ".ogg").then(r => r.ok ? r.arrayBuffer() : null).then(ab => ab && dec.decodeAudioData(ab)).then(b => {
      if (b && !BUF[f]) {
        BUF[f] = b;
        b.hit = hitTime(b);
      }
    }).catch(() => {}))).then(() => files.filter(f => BUF[f]).length);
  };
  S.titleReady = () => !!(S.ok && S.ctx && S.ctx.state === "running" && BUF.radio_keyup && BUF.radio_voice && S.master.gain.value > .001 && S.sfxBus.gain.value > .001 && S.cat.ui.gain.value > .001);
  function hitTime(b) {
    const d = b.getChannelData(0);
    let m = 0, k = 0;
    for (let i = 0; i < d.length; i += 4) {
      const a = Math.abs(d[i]);
      if (a > m) {
        m = a;
        k = i;
      }
    }
    return Math.min(.6, k / b.sampleRate);
  }
  S.hitOf = name => {
    const v = BANK[name];
    if (!v) return 0;
    let h = 0;
    for (const x of v) {
      const b = BUF[x[0]];
      if (b) h = Math.max(h, b.hit / x[1]);
    }
    return h;
  };
  function pick(name) {
    const mv = S.modSnd && S.modSnd[name];
    if (mv && mv.length) {
      const ok = mv.filter(x => BUF[x[0]]);
      if (ok.length) return ok[Math.random() * ok.length | 0];
    }
    const v = BANK[name];
    if (!v) return null;
    const ok = v.filter(x => BUF[x[0]]);
    return ok.length ? ok[Math.random() * ok.length | 0] : null;
  }
  S.bankOf = name => BANK[name] || null;
  S.bankNames = () => Object.keys(BANK);
  S.modSnd = null;
  function smp(dest, t, name, o) {
    const x = pick(name);
    if (!x) return false;
    const src = S.ctx.createBufferSource();
    src.buffer = BUF[x[0]];
    src.playbackRate.value = x[1] * (o && o.r || 1) * R(.96, 1.04);
    const g = S.ctx.createGain();
    g.gain.value = x[2] * ((o && o.v) == null ? 1 : o.v);
    src.connect(g);
    g.connect(dest);
    src.start(t);
    LIVE.add(src);
    src.onended = () => LIVE.delete(src);
    return true;
  }
  S.stopSounds = function() {
    for (const s of LIVE) {
      try {
        s.stop();
      } catch (e) {}
    }
    LIVE.clear();
  };
  const STEP_OF = {
    conc: "step_conc",
    tile: "step_tile",
    wood: "step_wood",
    carpet: "step_carpet",
    grass: "step_grass",
    water: "step_water"
  }, STEP_MIX = {};
  const FX = {
    step(d, t, o) {
      const sf = STEP_OF[o.surface] || "step_conc", w = o.w == null ? .5 : o.w;
      if (!pick(sf)) return false;
      if (o.kind === "dog") {
        if (!pick("step_dog")) return false;
        smp(d, t, "step_dog");
        smp(d, t + .1, "step_dog", {
          v: .8
        });
        return true;
      }
      if (o.kind === "zombie") {
        smp(d, t, "step_drag", {
          v: .8
        });
        smp(d, t + .22, sf, {
          r: .84,
          v: .8
        });
        return true;
      }
      smp(d, t, sf, {
        r: o.kind === "boot" ? .9 : .9 + w * .12,
        v: .7 + w * .4
      });
      if (STEP_MIX[o.surface]) smp(d, t + .01, STEP_MIX[o.surface], {
        v: .45 + w * .3
      });
      if (o.kind === "boot" && Math.random() < .3) smp(d, t + .05, "gearRattle");
      return true;
    },
    stairsUp(d, t) {
      if (!pick("stair")) return false;
      for (let i = 0; i < 5; i++) smp(d, t + i * .52 + Math.random() * .04, "stair", {
        r: .94,
        v: .85 + i % 2 * .15
      });
      return true;
    },
    stairsDown(d, t) {
      if (!pick("stair")) return false;
      for (let i = 0; i < 5; i++) smp(d, t + i * .43 + Math.random() * .04, "stair", {
        r: 1.03,
        v: .85 + i % 2 * .15
      });
      return true;
    },
    beep(d, t, o) {
      return o.hi ? smp(d, t, "beepHi") : smp(d, t, "beep");
    },
    beacon(d, t, o) {
      if (!pick("squelch")) return false;
      if (o.x != null) return smp(d, t, "beepHi");
      smp(d, t, "radioOn");
      smp(d, t + .35, "chatter", {
        v: .7
      });
      smp(d, t + 4.4, "squelch");
      return true;
    },
    heal(d, t) {
      return smp(d, t, "exhale", {
        v: .5,
        r: 1.05
      });
    },
    titleRadio(d, t) {
      if (!pick("radioKey") || !pick("radioVoice")) return false;
      smp(d, t, "radioKey");
      smp(d, t + .3, "radioOpen");
      smp(d, t + .38, "radioVoice");
      smp(d, t + 1.5, "radioRoger");
      return true;
    },
    death(d, t) {
      if (!pick("deathVoice")) return false;
      smp(d, t, "deathVoice");
      smp(d, t + .35, "bodyFall");
      smp(d, t + .2, "stinger", {
        v: .8
      });
      return true;
    },
    extract(d, t) {
      if (!pick("squelch")) return false;
      smp(d, t, "squelch");
      smp(d, t + .3, "exhale", {
        v: .6
      });
      return true;
    },
    bleed(d, t) {
      if (!pick("hurt")) return false;
      smp(d, t, "hitFlesh", {
        v: .6
      });
      smp(d, t + .05, "hurt");
      return true;
    },
    bone(d, t) {
      if (!pick("bone")) return false;
      smp(d, t, "bone");
      smp(d, t + .08, "hurt");
      return true;
    },
    sick(d, t) {
      return smp(d, t, "sick");
    },
    drink(d, t) {
      if (!pick("drinkOpen")) return false;
      smp(d, t, "drinkOpen");
      smp(d, t + .35, "drinkPour", {
        v: .6
      });
      return true;
    },
    trapSnap(d, t) {
      if (!pick("trapSpring")) return false;
      smp(d, t, "trapSpring");
      smp(d, t + .03, "trapHit");
      smp(d, t + .05, "hitFlesh", {
        v: .5
      });
      return true;
    },
    eatFx(d, t) {
      if (!pick("eat")) return false;
      for (let i = 0; i < 3; i++) smp(d, t + i * .42 + Math.random() * .08, "eat", {
        v: .8
      });
      return true;
    },
    secretSlide(d, t) {
      if (!pick("secretSlide")) return false;
      smp(d, t, "secretSlide");
      smp(d, t + .12, "secretCreak");
      return true;
    },
    secretClose(d, t) {
      if (!pick("secretClose")) return false;
      smp(d, t, "secretClose");
      smp(d, t + .1, "secretCreak", {
        v: .8,
        r: .9
      });
      smp(d, t + .68, "doorClose", {
        v: .6,
        r: .7
      });
      return true;
    },
    doorOpen(d, t) {
      if (!pick("doorOpen")) return false;
      if (Math.random() < .12 && BUF.door_creak) {
        smp(d, t, "__door_creak", {
          v: .8
        });
        return true;
      }
      if (Math.random() < .5) smp(d, t, "doorLocked", {
        v: .35
      });
      smp(d, t + .06, "doorOpen");
      return true;
    },
    gateUnlock(d, t) {
      if (!BUF.lock_key) return false;
      smp(d, t, "__lock_key");
      smp(d, t + 1.5, "__gate_latch");
      return true;
    },
    keyTurn(d, t) {
      if (!BUF.lock_key) return false;
      smp(d, t, "__lock_key");
      return true;
    },
    cylEject(d, t) {
      if (!pick("casing_conc")) return false;
      for (let i = 0; i < 4; i++) smp(d, t + .05 + Math.random() * .25, "casing_" + [ "conc", "tile", "wood" ][i % 3], {
        v: .5,
        r: 1.2
      });
      return true;
    },
    openCrate(d, t) {
      if (!pick("latchSnap")) return false;
      smp(d, t, "latchSnap");
      smp(d, t + .24, "lidWood", {
        v: .9
      });
      return true;
    },
    openStash(d, t) {
      if (!pick("latchSnap")) return false;
      smp(d, t, "latchSnap");
      smp(d, t + .2, "latchSnap", {
        r: .92
      });
      smp(d, t + .4, "metalCreak", {
        v: .55,
        r: 1.1
      });
      return true;
    },
    openArmory(d, t) {
      if (!pick("metalCreak")) return false;
      smp(d, t, "__gate_latch", {
        v: .8
      });
      smp(d, t + .3, "metalCreak", {
        r: .85
      });
      return true;
    },
    openDrawer(d, t) {
      return smp(d, t, "drawer");
    },
    openLocker(d, t) {
      if (!pick("lockerRattle")) return false;
      smp(d, t, "pin", {
        v: .6
      });
      smp(d, t + .08, "lockerRattle");
      return true;
    },
    openShelf(d, t) {
      return smp(d, t, "shelfMetal");
    },
    openFiling(d, t) {
      return smp(d, t, "metalDrawer");
    },
    openShelfWood(d, t) {
      if (!pick("lidWood")) return false;
      smp(d, t, "lidWood", {
        r: 1.05,
        v: .75
      });
      smp(d, t + .16, "woodTap", {
        v: .8
      });
      return true;
    },
    openFridge(d, t) {
      return smp(d, t, "fridgeDoor");
    },
    openCupboard(d, t) {
      return smp(d, t, "cupboard");
    },
    openTrash(d, t) {
      if (!pick("bottle")) return false;
      smp(d, t, "box", {
        v: .9
      });
      smp(d, t + .15, "bottle", {
        v: .55
      });
      return true;
    },
    openBody(d, t) {
      if (!pick("buckle")) return false;
      smp(d, t, "rustle");
      smp(d, t + .14, "buckle", {
        v: .55
      });
      return true;
    },
    openRack(d, t) {
      if (!pick("gunClack")) return false;
      smp(d, t, "gunClack");
      smp(d, t + .12, "gearRattle", {
        v: .5
      });
      return true;
    },
    openGlass(d, t) {
      if (!pick("lockClick")) return false;
      smp(d, t, "lockClick", {
        v: .7
      });
      smp(d, t + .14, "cupboard", {
        r: 1.15,
        v: .7
      });
      return true;
    },
    openSafe(d, t) {
      if (!pick("lockClick")) return false;
      smp(d, t, "lockClick");
      smp(d, t + .28, "lockClick", {
        r: .88
      });
      smp(d, t + .55, "metalCreak", {
        r: .8,
        v: .8
      });
      return true;
    },
    openCloset(d, t) {
      return smp(d, t, "closet");
    },
    openWood(d, t) {
      if (!pick("lidWood")) return false;
      smp(d, t, "lidWood", {
        r: 1.1,
        v: .6
      });
      smp(d, t + .1, "paper", {
        v: .6
      });
      return true;
    },
    groan(d, t, o) {
      return smp(d, t, o.hiss ? "hiss" : "groan");
    },
    flashbang(d, t) {
      if (!pick("explode") || !pick("flashBoom")) return false;
      smp(d, t, "flashBoom");
      smp(d, t + .01, "explode", {
        r: 1.7,
        v: .75
      });
      return true;
    },
    gasPop(d, t) {
      if (!pick("pin") || !pick("gasHiss")) return false;
      smp(d, t, "pin");
      smp(d, t + .06, "flare", {
        r: 1.3,
        v: .5
      });
      smp(d, t + .25, "gasHiss");
      return true;
    },
    fishThrow(d, t) {
      if (!pick("fishCast")) return false;
      smp(d, t, "fishBait", {
        v: .7
      });
      smp(d, t + .28, "fishCast");
      smp(d, t + .4, "fishLine", {
        v: .8
      });
      return true;
    },
    fishHook(d, t) {
      if (!pick("fishSplash")) return false;
      smp(d, t, "fishSplash", {
        v: .8
      });
      smp(d, t + .05, "fishCreak");
      return true;
    },
    fishRun(d, t) {
      return smp(d, t, "fishDrag");
    },
    fishLand(d, t) {
      if (!pick("fishFlop")) return false;
      smp(d, t, "fishSplash", {
        v: .7
      });
      smp(d, t + .4, "fishFlop");
      smp(d, t + .8, "fishFlop", {
        v: .7
      });
      return true;
    },
    nvgFlip(d, t, o) {
      if (!pick("nvgOn")) return false;
      if (o.on) {
        smp(d, t, "nvgOn");
        smp(d, t + .08, "nvgWhine");
      } else smp(d, t, "nvgOff");
      return true;
    },
    trapLay(d, t, o) {
      if (!pick("trapPry")) return false;
      if (o.wire) smp(d, t, "wireStretch"); else {
        smp(d, t, "trapPry");
        smp(d, t + .5, "trapChain", {
          v: .6
        });
      }
      return true;
    },
    trapArm(d, t, o) {
      if (!pick("trapDown")) return false;
      if (o.wire) {
        smp(d, t, "wireClick");
        smp(d, t + .12, "pin", {
          v: .4
        });
      } else {
        smp(d, t, "trapDown");
        smp(d, t + .05, "trapChain", {
          v: .5
        });
        smp(d, t + .4, "pin", {
          v: .45,
          r: .9
        });
      }
      return true;
    },
    takedown(d, t) {
      if (!pick("stab")) return false;
      smp(d, t, "rustle", {
        v: .8
      });
      smp(d, t + .12, "stab");
      return true;
    },
    cookHeat(d, t) {
      if (!pick("stoveIgnite")) return false;
      smp(d, t, "stoveIgnite");
      smp(d, t + .6, "potBoil");
      return true;
    },
    cookChop(d, t) {
      if (!pick("chop")) return false;
      for (let i = 0; i < 3; i++) smp(d, t + i * .36 + Math.random() * .04, "chop", {
        v: i === 1 ? .85 : 1
      });
      return true;
    },
    cooler(d, t) {
      if (!pick("drinkGulp")) return false;
      smp(d, t, "drinkPour");
      smp(d, t + 1.15, "drinkGulp");
      smp(d, t + 1.6, "drinkGulp", {
        v: .9
      });
      return true;
    },
    coolerFill(d, t) {
      if (!pick("coolerGlug")) return false;
      smp(d, t, "coolerGlug");
      smp(d, t + .75, "coolerGlug", {
        v: .8
      });
      return true;
    },
    gardenPlant(d, t) {
      return smp(d, t, "dig");
    },
    gardenWater(d, t) {
      return smp(d, t, "waterCan");
    },
    gardenPull(d, t) {
      if (!pick("harvestLeaf")) return false;
      smp(d, t, "harvestLeaf");
      smp(d, t + .35, "harvestSoil", {
        v: .8
      });
      return true;
    },
    bagFold(d, t) {
      if (!pick("bagCrumple")) return false;
      smp(d, t, "bagCrumple");
      smp(d, t + .5, "bagPress", {
        v: .8
      });
      smp(d, t + .75, "strapPull");
      return true;
    },
    bagUnfold(d, t) {
      if (!pick("strapPull")) return false;
      smp(d, t, "strapPull", {
        r: 1.05
      });
      smp(d, t + .3, "bagCrumple", {
        v: .8
      });
      return true;
    },
    reviveDone(d, t) {
      return smp(d, t, "reviveUp");
    },
    furnPet(d, t, o) {
      if (!pick("plasticCrk")) return false;
      smp(d, t, "plasticCrk", {
        r: o.lift ? 1.08 : .92
      });
      if (!o.lift) smp(d, t + .05, "waterSlosh", {
        v: .6,
        r: 1.25
      });
      return true;
    },
    furnSack(d, t, o) {
      if (!pick("plasticCrk")) return false;
      smp(d, t, "plasticCrk", {
        r: 1.15
      });
      smp(d, t + .13, "plasticCrk", {
        r: 1.3,
        v: .7
      });
      return true;
    },
    furnCarton(d, t, o) {
      if (!pick("box")) return false;
      smp(d, t, "box", {
        v: .85,
        r: o.lift ? 1.08 : .95
      });
      smp(d, t + .08, "plasticCrk", {
        v: .5,
        r: 1.1
      });
      return true;
    },
    furnPallet(d, t, o) {
      if (!pick("plasticCrk")) return false;
      smp(d, t, "woodTap", {
        r: .8
      });
      smp(d, t + .04, "plasticCrk", {
        r: .85
      });
      if (!o.lift) smp(d, t + .1, "waterSlosh", {
        v: .75
      });
      return true;
    },
    furnShelfW(d, t, o) {
      if (!pick("shelfMetal")) return false;
      smp(d, t, "shelfMetal", {
        v: .7
      });
      smp(d, t + .1, "plasticCrk", {
        v: .6,
        r: 1.2
      });
      return true;
    },
    furnJugs(d, t, o) {
      if (!pick("waterSlosh")) return false;
      smp(d, t, "shelfMetal", {
        v: .6
      });
      smp(d, t + .08, "waterSlosh", {
        r: o.lift ? 1.1 : 1
      });
      return true;
    },
    furnCase(d, t, o) {
      if (!pick("shelfMetal")) return false;
      smp(d, t, "shelfMetal", {
        r: .85,
        v: .8
      });
      smp(d, t + .06, "bottle", {
        v: .35,
        r: 1.2
      });
      return true;
    },
    furnWallB(d, t, o) {
      if (!pick("plasticCrk")) return false;
      smp(d, t, "woodTap");
      smp(d, t + .05, "plasticCrk", {
        v: .6,
        r: 1.2
      });
      return true;
    },
    trashThrow(d, t) {
      if (!pick("trashDump")) return false;
      smp(d, t, "trashBag", {
        v: .8
      });
      smp(d, t + .38, "trashDump");
      return true;
    },
    hitWall(d, t, o) {
      return smp(d, t, o.hi ? "hitMetal" : "hitWall");
    },
    casing(d, t, o) {
      const sf = o.surface === "tile" || o.surface === "wood" ? o.surface : "conc", soft = o.surface === "carpet" || o.surface === "grass" || o.surface === "water" ? .3 : 1;
      return o.shell ? smp(d, t, "shellDrop", {
        v: .8 * soft
      }) : smp(d, t, "casing_" + sf, {
        v: soft
      });
    }
  };
  BANK.__lock_key = V("lock_key");
  BANK.__gate_latch = V("gate_latch");
  BANK.__door_creak = V("door_creak");
  Object.assign(BANK, {
    topGlass: V([ "top_glass_1", 1, .4 ], [ "top_glass_2", 1, .32 ], [ "top_glass_3", 1, .4 ]),
    topCeramic: V([ "top_glass_1", .72, .5 ], [ "top_glass_3", .76, .5 ]),
    topPlastic: V([ "top_plastic_1", 1, .42 ], [ "top_plastic_2", 1, .42 ], [ "top_plastic_3", 1, .42 ]),
    topMetal: V([ "top_metal_1", 1, .36 ], [ "top_metal_2", 1, .36 ], [ "top_metal_3", 1, .3 ]),
    topPaper: V([ "top_paper_1", 1, .42 ], [ "top_paper_2", 1, .38 ]),
    topSoil: V([ "top_soil_1", 1, .36 ], [ "top_soil_2", 1, .36 ]),
    topWood: V([ "surf_wood_2", 1.45, .4 ], [ "surf_wood_1", 1.6, .3 ]),
    surfWood: V([ "surf_wood_1", 1.15, .28 ], [ "surf_wood_2", 1.05, .32 ]),
    surfMetal: V([ "surf_metal_1", 1.2, .2 ]),
    surfStone: V([ "surf_stone_1", .85, .36 ]),
    surfCard: V([ "surf_card_1", 1, .34 ], [ "surf_card_2", 1, .34 ])
  });
  BANK.chairSpin = V([ "fish_creak_1", .84, .36 ], [ "fish_creak_2", .88, .36 ], [ "fish_creak_3", .86, .32 ]);
  const GAIN = {
    pistol: 1.3,
    revolver: 1.3,
    smg: 1.3,
    rifle: 1.35,
    lmg: 1.35,
    sniper: 1.4,
    shotgun: 1.35,
    homemade: 1.25,
    suppressed: 1.1,
    enemyGun: 1.3,
    far_pistol: 1.2,
    far_smg: 1.2,
    far_rifle: 1.2,
    far_lmg: 1.2,
    far_shotgun: 1.2,
    explode: 1.3,
    doorOpen: .6,
    doorClose: .6,
    doorLocked: .6,
    doorBash: .9,
    locked: .6,
    __lock_key: .6,
    __gate_latch: .6,
    __door_creak: .55,
    click: .5,
    denied: .55,
    confirm: .6,
    buy: .6,
    beep: .5,
    beepHi: .6,
    radioOn: .6,
    squelch: .6,
    chatter: .5,
    thunder: 1.1,
    heliLand: 1.2,
    dogBark: .8,
    dogGrowl: .75,
    dogWhimper: .7,
    hurt: .7,
    deathVoice: .8,
    sick: .6,
    bodyFall: .8,
    stinger: .7,
    bandage: .5,
    eat: .6,
    drinkOpen: .5,
    drinkPour: .45,
    exhale: .55,
    latchSnap: .5,
    lidWood: .5,
    drawer: .55,
    metalDrawer: .55,
    lockerRattle: .5,
    metalCreak: .45,
    shelfMetal: .5,
    fridgeDoor: .55,
    cupboard: .55,
    buckle: .4,
    bottle: .4,
    gunClack: .55,
    lockClick: .5,
    closet: .5,
    woodTap: .3,
    zipper: .45,
    paper: .45,
    box: .55,
    pin: .6,
    trapSpring: .8,
    trapHit: .8,
    zip: .7,
    flare: .8,
    gas: .6,
    step_conc: .42,
    step_tile: .42,
    step_wood: .4,
    step_carpet: .4,
    step_grass: .4,
    step_water: .45,
    step_dog: .4,
    step_drag: .4,
    stair: .45,
    gymBag: .8,
    gymRack: .7,
    gymPlate: .6,
    gymDumbbell: .6,
    gymBench: .5,
    gymDrop: .8,
    gymGrunt: .55,
    gymBreath: .5,
    gymSwish: .5,
    gymSlap: .45,
    gymLand: .5,
    gymMotor: .4,
    gymBike: .35,
    pickup: .45,
    rustle: .4,
    hitFlesh: .6,
    hitWall: .5,
    hitMetal: .6,
    empty: .6,
    groan: .8,
    hiss: .8,
    bite: .8,
    punch: .7,
    melee: .7,
    swing: .7,
    shout: .5,
    brick: .7,
    flashCrack: 1.35,
    gasHiss: .55,
    cough: .6,
    elecSpark: .45,
    elecZap: .9,
    fishCast: .5,
    fishLine: .8,
    fishDrag: .9,
    fishReel: .35,
    fishSplash: .55,
    fishFlop: .7,
    fishCreak: .5,
    fishBait: .4,
    gust: .7,
    winRattle: .6,
    nvgOn: .6,
    nvgWhine: .22,
    nvgOff: .5,
    trapPry: .45,
    trapDown: .6,
    trapChain: .45,
    wireStretch: .55,
    wireClick: .6,
    stab: .6,
    potBoil: .4,
    stoveIgnite: .6,
    chop: .5,
    coolerPour: .45,
    coolerGlug: .4,
    drinkPour: .45,
    drinkGulp: .6,
    dig: .45,
    waterCan: .9,
    harvestLeaf: .45,
    harvestSoil: .45,
    bagCrumple: .45,
    bagPress: .5,
    strapPull: .6,
    reviveUp: .6,
    shutter: .6,
    radioKey: .27,
    radioOpen: .156,
    radioVoice: .24,
    radioRoger: .252,
    plasticCrk: .45,
    waterSlosh: .4,
    cleanSweep: .5,
    cleanWipe: .5,
    trashPaper: .45,
    trashCan: .5,
    trashBottle: .4,
    trashBag: .45,
    trashMisc: .45,
    trashDump: .7
  };
  for (const k in GAIN) if (BANK[k]) BANK[k] = BANK[k].map(v => [ v[0], v[1], v[2] * GAIN[k] ]);
  const ALIAS = {
    pmagOut: "magOut",
    slideRack: "slideFwd",
    smgCharge: "chargeFwd",
    tmpCharge: "chargeFwd",
    ppsh: "chargeFwd",
    rifleCharge: "chargeFwd",
    heavyCharge: "chargeFwd",
    heavyClose: "breakClose",
    boltA: "boltBack",
    boltB: "boltFwd",
    k98Open: "boltUp",
    k98Close: "boltDown",
    latch: "breakOpen",
    screw: "pipeOpen",
    shellDrop: "shellEject",
    rattleS: "rattle",
    casing: "casing",
    flashbang: "explode",
    flashCrack: "explode",
    flashBoom: "explode",
    elecZap: "explode",
    elecSpark: "click",
    gasPop: "gas",
    gasHiss: "gas",
    cough: "sick",
    openCrate: "rustle",
    openStash: "rustle",
    openArmory: "rustle",
    openDrawer: "rustle",
    openLocker: "rustle",
    openShelf: "rustle",
    openFiling: "rustle",
    openShelfWood: "rustle",
    openFridge: "rustle",
    openCupboard: "rustle",
    trashThrow: "rustle",
    cleanSweep: "rustle",
    cleanWipe: "rustle",
    trashPaper: "rustle",
    trashCan: "rustle",
    trashBottle: "rustle",
    trashBag: "rustle",
    trashMisc: "rustle",
    trashDump: "rustle",
    openTrash: "rustle",
    openBody: "rustle",
    openRack: "rustle",
    openGlass: "rustle",
    openSafe: "rustle",
    openCloset: "rustle",
    openWood: "rustle",
    furnPet: "pickup",
    furnSack: "pickup",
    furnCarton: "pickup",
    furnPallet: "pickup",
    furnShelfW: "pickup",
    furnJugs: "pickup",
    furnCase: "pickup",
    furnWallB: "pickup"
  };
  S.OPEN_CONT = {
    armory: "openArmory",
    crate: "openCrate",
    cabinet: "openFiling",
    desk: "openDrawer",
    locker: "openLocker",
    fridge: "openFridge",
    shelf: "openShelf",
    medcab: "openGlass",
    trash: "openTrash",
    bag: "zipper",
    corpse: "openBody",
    loose: "rustle",
    vault: "openSafe"
  };
  S.OPEN_FURN = {
    stash: "openStash",
    bookshelf: "openWood",
    safe: "openSafe",
    locker: "openLocker",
    shelf: "openShelf",
    cabinet: "openFiling",
    crate: "openCrate",
    displayCase: "openGlass",
    displayShelf: "openShelfWood",
    pedestal: "pickup",
    gunRack: "openRack",
    wardrobe: "openCloset",
    clothes: "rustle",
    cupboard: "openCupboard",
    fridge: "openFridge",
    waterPack: "furnPet",
    waterBoxes: "furnCarton",
    bottleWall: "furnWallB",
    waterPallet: "furnPallet",
    waterShelf: "furnShelfW",
    waterJugRack: "furnJugs",
    waterCase: "openFridge"
  };
  S.FURN_SND = {
    waterPack: "furnPet",
    bottleWall: "furnWallB",
    bottleSack: "furnSack",
    waterBoxes: "furnCarton",
    waterPallet: "furnPallet",
    waterShelf: "furnShelfW",
    waterJugRack: "furnJugs",
    waterCase: "furnCase"
  };
  const loopG = {};
  function startLoops() {
    if (!S.ok) return;
    for (const f of LOOPS) {
      if (loopG[f] || !BUF[f]) continue;
      const src = S.ctx.createBufferSource();
      src.buffer = BUF[f];
      src.loop = true;
      const g = S.ctx.createGain();
      g.gain.value = 0;
      src.connect(g);
      g.connect(f === "amb_drone" || f === "amb_rumble" ? S.musBus : S.ambBus);
      src.start(S.ctx.currentTime, Math.random() * BUF[f].duration);
      loopG[f] = g;
    }
  }
  S.bank = BANK;
  S.loopNames = LOOPS;
  S.fxNames = () => Object.keys(FX);
  S.synthNames = () => Object.keys(LIB);
  S.addSounds = function(o) {
    if (!o) return;
    for (const k in o.bank || {}) {
      const g = o.gain && o.gain[k] || 1;
      BANK[k] = o.bank[k].map(v => [ v[0], v[1] || 1, (v[2] == null ? 1 : v[2]) * g ]);
    }
    for (const k in o.steps || {}) STEP_OF[k] = o.steps[k];
    for (const k in o.mix || {}) STEP_MIX[k] = o.mix[k];
    for (const k in o.fx || {}) {
      const fn = o.fx[k];
      FX[k] = (d, t, oo) => fn(d, t, oo || {}, smp, pick);
    }
    for (const k in o.cat || {}) CAT_OF[k] = o.cat[k];
  };
  S.addSounds({
    bank: {
      kitSet: [ [ "kit_set_1", 1, 1 ], [ "kit_set_1", .92, 1 ] ],
      kitSnap: [ [ "kit_clip_1", 1, 1 ], [ "kit_clip_2", 1, 1 ] ],
      kitCap: [ [ "kit_cap_1", 1, 1 ] ],
      kitPourW: [ [ "kit_pour_1", 1, 1 ], [ "kit_pour_2", 1, 1 ] ],
      kitDrop: [ [ "kit_drip_1", 1, 1 ], [ "kit_drip_2", 1, 1 ] ]
    },
    gain: {
      kitSet: .5,
      kitSnap: .55,
      kitCap: .45,
      kitPourW: .5,
      kitDrop: .35
    },
    fx: {
      kitClip(d, t, o, smp, pick) {
        if (!pick("kitSnap")) return false;
        smp(d, t + .45, "kitSet");
        smp(d, t + .85, "kitSnap");
        smp(d, t + 1.15, "kitSnap", {
          v: .85,
          r: 1.05
        });
        return true;
      },
      kitUnclip(d, t, o, smp, pick) {
        if (!pick("kitSnap")) return false;
        smp(d, t, "kitSnap", {
          r: .95
        });
        smp(d, t + .55, "kitSet", {
          v: .8,
          r: 1.06
        });
        return true;
      },
      kitPour(d, t, o, smp, pick) {
        if (!pick("kitPourW")) return false;
        smp(d, t, "kitCap");
        smp(d, t + .42, "kitPourW");
        return true;
      },
      kitDrip(d, t, o, smp, pick) {
        return smp(d, t, "kitDrop");
      }
    }
  });
  S.addSounds({
    bank: {
      binLidO: [ [ "dr_plastic_open_1", 1, 1 ] ],
      binLidC: [ [ "dr_plastic_close_1", 1, 1 ], [ "dr_plastic_close_2", 1, 1 ] ],
      binClang: [ [ "surf_metal_1", .9, 1 ] ],
      binRattle: [ [ "rattle_1", 1.15, 1 ], [ "rattle_2", 1.15, 1 ], [ "rattle_3", 1.2, 1 ] ]
    },
    gain: {
      binLidO: .55,
      binLidC: .45,
      binClang: .3,
      binRattle: .35
    },
    fx: {
      binDumpCard(d, t, o, smp, pick) {
        if (!pick("trashDump")) return false;
        smp(d, t, "box", {
          v: .7
        });
        smp(d, t + .12, "trashBag", {
          v: .75
        });
        smp(d, t + .45, "trashDump", {
          v: .8,
          r: 1.06
        });
        return true;
      },
      binDumpMesh(d, t, o, smp, pick) {
        if (!pick("trashDump")) return false;
        smp(d, t, "trashBag", {
          v: .8
        });
        smp(d, t + .36, "trashDump", {
          v: .75,
          r: 1.04
        });
        smp(d, t + .42, "binRattle", {
          v: .6,
          r: 1.25
        });
        return true;
      },
      binDumpPedal(d, t, o, smp, pick) {
        if (!pick("trashDump")) return false;
        smp(d, t, "binLidO", {
          r: 1.1
        });
        smp(d, t + .2, "trashBag", {
          v: .75
        });
        smp(d, t + .5, "trashDump", {
          v: .75
        });
        smp(d, t + .85, "binLidC", {
          r: 1.15
        });
        return true;
      },
      binDumpMetal(d, t, o, smp, pick) {
        if (!pick("trashDump")) return false;
        smp(d, t, "binRattle", {
          v: .7
        });
        smp(d, t + .25, "trashBag", {
          v: .75
        });
        smp(d, t + .55, "trashDump");
        smp(d, t + .9, "binClang");
        return true;
      },
      binDumpSort(d, t, o, smp, pick) {
        if (!pick("trashDump")) return false;
        const by = o.by || {}, S1 = {
          폐지: "trashPaper",
          "빈 캔": "trashCan",
          "빈 병": "trashBottle",
          비닐: "trashBag",
          잡쓰레기: "trashMisc"
        }, ks = Object.keys(S1).filter(k => by[k]);
        let tt = t + .18;
        smp(d, t, "binLidO", {
          r: 1.05,
          v: .8
        });
        for (const k of ks.length ? ks : [ "잡쓰레기" ]) {
          smp(d, tt, S1[k], {
            v: .85
          });
          tt += .22;
        }
        smp(d, tt + .1, "binLidC", {
          r: 1.05
        });
        return true;
      },
      binDumpBig(d, t, o, smp, pick) {
        if (!pick("trashDump")) return false;
        smp(d, t, "binLidO", {
          r: .78,
          v: 1.1
        });
        smp(d, t + .3, "trashBag", {
          v: .8
        });
        smp(d, t + .62, "trashDump", {
          r: .86
        });
        smp(d, t + 1, "binLidC", {
          r: .72,
          v: 1.2
        });
        return true;
      },
      binSetMetal(d, t, o, smp, pick) {
        if (!pick("binRattle")) return false;
        if (o.lift) smp(d, t, "binRattle", {
          r: 1.1,
          v: .8
        }); else {
          smp(d, t, "binClang", {
            r: 1.1,
            v: .7
          });
          smp(d, t + .05, "binRattle", {
            v: .5
          });
        }
        return true;
      },
      binSetMesh(d, t, o, smp, pick) {
        if (!pick("binRattle")) return false;
        smp(d, t, "binRattle", {
          r: 1.35,
          v: .6
        });
        smp(d, t + .06, "trashBag", {
          v: .35
        });
        return true;
      },
      binSetPlastic(d, t, o, smp, pick) {
        if (!pick("binLidC")) return false;
        smp(d, t, o.lift ? "binLidO" : "binLidC", {
          r: 1.08,
          v: .8
        });
        smp(d, t + .05, "trashBag", {
          v: .3
        });
        return true;
      },
      binSetBig(d, t, o, smp, pick) {
        if (!pick("binLidC")) return false;
        smp(d, t, o.lift ? "binLidO" : "binLidC", {
          r: .75,
          v: 1
        });
        smp(d, t + .08, "plasticCrk", {
          r: .8,
          v: .6
        });
        return true;
      }
    }
  });
  Object.assign(S.FURN_SND, {
    binBox: "furnCarton",
    binMesh: "binSetMesh",
    binPedal: "binSetPlastic",
    binMetal: "binSetMetal",
    binRecycle: "binSetPlastic",
    binWheelie: "binSetBig"
  });
  const TV_NEWS = [];
  for (let k = 1; k <= 10; k++) TV_NEWS.push([ "tv_news_" + k, 1, 1 ]);
  S.addSounds({
    bank: {
      lightSwitch: [ [ "nvg_off", 1, 1 ], [ "nvg_off", .93, 1 ] ],
      tvVoice: TV_NEWS
    },
    gain: {
      lightSwitch: .45,
      tvVoice: 1
    },
    cat: {
      tvVoice: "amb"
    }
  });
  S.addSounds({
    bank: {
      fanHum: [ [ "fan_hum", 1, 1 ] ]
    },
    cat: {
      fanHum: "amb"
    }
  });
  S.addSounds({
    bank: {
      fanSwitch: [ [ "nvg_off", 1.16, 1 ], [ "nvg_off", 1.09, 1 ] ]
    },
    gain: {
      fanSwitch: .3
    }
  });
  const spots = new Map;
  S.spotLoop = function(id, name, o) {
    if (!S.ok) return false;
    let e = spots.get(id);
    if (!o) {
      if (e) spotEnd(id, e);
      return false;
    }
    if (!(BANK[name] || []).some(v => BUF[v[0]])) return false;
    if (!e) {
      const ctx = S.ctx, g = ctx.createGain();
      g.gain.value = 0;
      const p = ctx.createStereoPanner ? ctx.createStereoPanner() : null, f = ctx.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = 2e4;
      if (p) {
        g.connect(p);
        p.connect(f);
      } else g.connect(f);
      f.connect(S.ambBus);
      e = {
        g,
        p,
        f,
        name,
        bag: [],
        last: null,
        played: []
      };
      spots.set(id, e);
      spotNext(e, true);
    }
    const sp = spatial(o.x, o.y, o.range || 12), t = S.ctx.currentTime;
    const pr = SX.sndProp ? SX.sndProp.at(o, S.listener, o.range || 12, "item") : null;
    e.at = performance.now();
    e.g.gain.setTargetAtTime(sp.vol * (pr ? pr.k : 1) * (o.vol == null ? 1 : o.vol), t, .25);
    if (e.p) e.p.pan.setTargetAtTime(pr && pr.pan != null ? pr.pan : sp.pan, t, .2);
    e.f.frequency.setTargetAtTime(Math.min(16e3, sp.lp, pr ? pr.lp : 2e4), t, .2);
    return true;
  };
  function spotNext(e, first) {
    if (e.dead || !S.ctx) return;
    const vs = (BANK[e.name] || []).filter(v => BUF[v[0]]);
    if (!vs.length) return;
    const ctx = S.ctx, one = vs.length === 1;
    if (!e.bag.length) {
      e.bag = vs.slice();
      for (let i = e.bag.length - 1; i > 0; i--) {
        const j = Math.random() * (i + 1) | 0, x = e.bag[i];
        e.bag[i] = e.bag[j];
        e.bag[j] = x;
      }
      if (e.bag.length > 1 && e.bag[e.bag.length - 1][0] === e.last) e.bag.unshift(e.bag.pop());
    }
    const v = e.bag.pop(), b = BUF[v[0]], src = ctx.createBufferSource(), sg = ctx.createGain();
    src.buffer = b;
    src.loop = one;
    sg.gain.value = v[2];
    src.connect(sg);
    sg.connect(e.g);
    src.start(ctx.currentTime, first ? Math.random() * b.duration * (one ? 1 : .6) : 0);
    e.src = src;
    e.last = v[0];
    e.played.push(v[0]);
    if (e.played.length > 24) e.played.shift();
    if (!one) src.onended = () => {
      if (e.dead || e.src !== src) return;
      e.wait = setTimeout(() => spotNext(e, false), 700 + Math.random() * 900);
    };
  }
  function spotEnd(id, e) {
    e.dead = true;
    clearTimeout(e.wait);
    const t = S.ctx.currentTime;
    e.g.gain.setTargetAtTime(0, t, .15);
    try {
      if (e.src) e.src.stop(t + .8);
    } catch (er) {}
    spots.delete(id);
  }
  S.spotIds = () => [ ...spots.keys() ];
  S.spotInfo = id => {
    const e = spots.get(id);
    return e ? {
      cur: e.last,
      played: e.played.slice()
    } : null;
  };
  S.spotSkip = id => {
    const e = spots.get(id);
    if (e && e.src) {
      try {
        e.src.stop();
      } catch (er) {}
    }
    return !!e;
  };
  setInterval(() => {
    const now = performance.now();
    for (const [id, e] of spots) if (now - e.at > 400) spotEnd(id, e);
  }, 250);
  S.playFile = function(f, r, v) {
    if (!S.ok || !BUF[f]) return false;
    const d = out(v == null ? 1 : v, 0, 2e4, false), src = S.ctx.createBufferSource();
    src.buffer = BUF[f];
    src.playbackRate.value = r || 1;
    src.connect(d);
    src.start();
    return true;
  };
  S.loopWant = {};
  const lastT = new WeakMap;
  S.tgtCalls = 0;
  const tgt = (prm, v, t, tc) => {
    if (lastT.get(prm) === v) return;
    lastT.set(prm, v);
    S.tgtCalls++;
    prm.setTargetAtTime(v, t, tc);
  };
  const loopTo = (f, v, tc) => {
    S.loopWant[f] = v;
    const g = loopG[f];
    if (g) tgt(g.gain, v, S.ctx.currentTime, tc || 1.2);
  };
  S.loopPreview = (f, v) => {
    startLoops();
    loopTo(f, v, .3);
  };
  const GUNS = new Set([ "pistol", "revolver", "smg", "rifle", "lmg", "sniper", "shotgun", "homemade", "suppressed", "enemyGun" ]);
  S.DUCK = {
    DB: 4,
    ATK: .02,
    REL: .7,
    BOOM_R: 22,
    GUN_R: 6,
    TALK: {
      radioVoice: 1.2,
      titleRadio: 1.6,
      chatter: 4.1,
      beacon: 4.4
    }
  };
  S.duckN = 0;
  S.duckLast = null;
  S.duck = function(db, hold, why) {
    const c = S.ctx, n = S.musDuck;
    if (!c || !n) return false;
    const g = n.gain, t = c.currentTime, lo = Math.pow(10, -(db || S.DUCK.DB) / 20), h = Math.max(0, +hold || 0);
    const e0 = t + S.DUCK.ATK + h, pe = S.duckEnd, end = pe && pe.c === c && pe.t > e0 ? pe.t : e0;
    g.cancelScheduledValues(t);
    g.setValueAtTime(g.value, t);
    g.linearRampToValueAtTime(lo, t + S.DUCK.ATK);
    if (end > t + S.DUCK.ATK) g.setValueAtTime(lo, end);
    g.linearRampToValueAtTime(1, end + S.DUCK.REL);
    S.duckEnd = {
      c,
      t: end
    };
    S.duckN++;
    S.duckLast = {
      db: db || S.DUCK.DB,
      gain: +lo.toFixed(4),
      hold: h,
      why: why || "",
      at: +t.toFixed(3)
    };
    return true;
  };
  function duckFor(name, o, sp) {
    const D = S.DUCK, boom = name === "explode" || name === "flashbang";
    if (D.TALK[name] && !(name === "beacon" && o.x != null)) return S.duck(D.DB, D.TALK[name], "talk");
    if (!boom && !GUNS.has(name)) return false;
    const p = SX.actors && SX.actors.player;
    if (o.f != null && p && o.f !== p.floor) return false;
    const d = o.x != null ? sp.d : 0;
    if (boom ? d <= D.BOOM_R : d <= D.GUN_R) return S.duck(D.DB, 0, boom ? "boom" : "gun");
    return false;
  }
  S.names = () => [ ...new Set(Object.keys(LIB).concat(Object.keys(BANK).filter(k => !k.startsWith("__") && !k.startsWith("far_") && !k.startsWith("casing_")), Object.keys(FX))) ];
  S.play = function(name, o) {
    if (!(LIB[name] || BANK[name] || FX[name] || ALIAS[name] || S.modSnd && S.modSnd[name])) return;
    o = o || {};
    const sp = spatial(o.x, o.y, o.range);
    const prS = name === "step" && o.x != null && !o.amb && !S._off && SX.sndProp ? SX.sndProp.at(o, S.listener, o.range || 30, o.cat || S.catOf(name)) : undefined;
    if (o.x != null && SX.access && !S._off) SX.access.heard(name, o, sp, prS);
    if (SX.bgm && SX.bgm.heard && !S._off) SX.bgm.heard(name, o, sp, GUNS.has(name));
    if (!S.ok) return;
    const pr = prS !== undefined ? prS : o.x != null && !o.amb && !S._off && SX.sndProp ? SX.sndProp.at(o, S.listener, o.range || 30, o.cat || S.catOf(name)) : null;
    const v = sp.vol * (pr ? pr.k : 1) * (o.vol == null ? 1 : o.vol) * R(.9, 1.05);
    if (v < .01) return;
    if (S.musDuck && !o.amb) duckFor(name, o, sp);
    if (GUNS.has(name) && o.x != null) o.far = Math.max(0, Math.min(1, (sp.d - 10) / 30));
    const lp = pr ? Math.min(sp.lp, pr.lp) : sp.lp, vb = o.verb || S.parkVerb && SX.raid && SX.raid.on ? true : pr ? pr.verb : false;
    const dest = out(v, pr && pr.pan != null ? pr.pan : sp.pan, o.muffle ? Math.min(1200, lp) : lp, vb, o.cat || S.catOf(name));
    const t = S.ctx.currentTime + (o.delay || 0);
    if (GUNS.has(name) && o.far > .3) {
      const fk = FAR_OF[name];
      if (fk && pick(fk)) {
        smp(dest, t, fk, {
          v: Math.min(1, o.far * 1.6)
        });
        if (o.far < .7) smp(dest, t, name, {
          v: 1 - o.far
        });
        return;
      }
    }
    if (FX[name] && FX[name](dest, t, o)) return;
    if (smp(dest, t, name, o.r ? {
      r: o.r,
      v: o.v
    } : o.v != null ? {
      v: o.v
    } : null)) return;
    if (BANK[name] && S.loaded == null && qDec) {
      S.want(BANK[name].map(v => v[0]));
      return;
    }
    const fn = LIB[name] || LIB[ALIAS[name]];
    if (fn) fn(dest, t, o);
  };
  const FAR_OF = {
    pistol: "far_pistol",
    revolver: "far_pistol",
    homemade: "far_pistol",
    enemyGun: "far_pistol",
    smg: "far_smg",
    rifle: "far_rifle",
    sniper: "far_rifle",
    lmg: "far_lmg",
    shotgun: "far_shotgun"
  };
  S.part = function(ev, o) {
    S.play(ev.s, Object.assign({}, ev.o, o || {}));
  };
  S.render = async function(list, dur) {
    const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!OAC) return null;
    const ctx = new OAC(2, Math.ceil(44100 * dur), 44100);
    const keep = {
      ctx: S.ctx,
      sfx: S.sfxBus,
      verb: S.verb,
      nb: noiseBuf,
      ok: S.ok,
      L: S.listener
    };
    S.ctx = ctx;
    S.sfxBus = ctx.createGain();
    S.sfxBus.connect(ctx.destination);
    S.verb = ctx.createConvolver();
    S.verb.buffer = impulse(ctx, .9, 2.6);
    const vg = ctx.createGain();
    vg.gain.value = .35;
    S.verb.connect(vg);
    vg.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const nd = noiseBuf.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    S.ok = true;
    S.listener = {
      x: 0,
      y: 0,
      inside: false
    };
    S._off = true;
    try {
      for (const [n, o] of list) S.play(n, Object.assign({}, o));
    } finally {
      S.ctx = keep.ctx;
      S.sfxBus = keep.sfx;
      S.verb = keep.verb;
      noiseBuf = keep.nb;
      S.ok = keep.ok;
      S.listener = keep.L;
      S._off = false;
    }
    const buf = await ctx.startRendering();
    let peak = 0, sum = 0, nan = false, last = 0;
    for (let c = 0; c < buf.numberOfChannels; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < d.length; i++) {
        const v = d[i];
        if (v !== v) {
          nan = true;
          continue;
        }
        const a = Math.abs(v);
        if (a > peak) peak = a;
        sum += v * v;
        if (a > .003 && i > last) last = i;
      }
    }
    return {
      peak,
      rms: Math.sqrt(sum / (buf.length * buf.numberOfChannels)),
      nan,
      end: last / buf.sampleRate
    };
  };
  const amb = {
    rain: null,
    wind: null,
    hum: null,
    fire: null
  };
  function loopNoise(type, freq, q) {
    const ctx = S.ctx, src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = ctx.createGain();
    g.gain.value = 0;
    src.connect(f);
    f.connect(g);
    g.connect(S.ambBus);
    src.start();
    return {
      src,
      f,
      g
    };
  }
  S.ambient = function(state) {
    if (!S.ok) return;
    const t = S.ctx.currentTime;
    if (!amb.rain) {
      amb.rain = loopNoise("highpass", 1200, .4);
      amb.rain2 = loopNoise("lowpass", 500, .5);
      amb.wind = loopNoise("bandpass", 380, .6);
      amb.hum = loopNoise("lowpass", 120, 1);
      amb.fire = loopNoise("bandpass", 900, .8);
    }
    const rain = state.rain || 0, inside = !!state.inside;
    const syn = !loopG.amb_rain_out;
    tgt(amb.rain.g.gain, syn ? rain * (inside ? .05 : .22) : 0, t, syn ? .4 : .3);
    tgt(amb.rain.f.frequency, inside ? 3e3 : 1200, t, .4);
    tgt(amb.rain2.g.gain, syn ? rain * (inside ? .12 : .18) : 0, t, syn ? .4 : .3);
    tgt(amb.wind.g.gain, syn ? (state.wind || 0) * (inside ? .04 : .12) : 0, t, syn ? .8 : .3);
    tgt(amb.wind.f.frequency, 300 + Math.round(Math.sin(t * .3) * 30) * 4, t, 1);
    const rec = !!loopG.amb_inside;
    tgt(amb.hum.g.gain, rec ? 0 : (state.hum || 0) * .25, t, .8);
    if (loopG.amb_rain_out) {
      loopTo("amb_rain_out", inside ? 0 : rain * .9, .8);
      loopTo("amb_rain_in", inside ? rain * .8 : 0, .8);
      const w = state.wind || 0;
      loopTo("amb_wind_out", inside ? 0 : w * .55, 1);
      loopTo("amb_wind_in", inside ? w * .6 : 0, 1);
      loopTo("amb_fire", (state.fire || 0) * .8, .5);
      loopTo("amb_market", (state.market || 0) * .5, 1.5);
      loopTo("amb_city", (state.city || 0) * .4, 1.5);
      loopTo("amb_heli", (state.heli || 0) * .9, 1.5);
      loopTo("amb_heart", (state.heart || 0) * .7, .6);
      loopTo("amb_alarm", (state.alarm || 0) * .45, 1.5);
      loopTo("amb_flood", (state.flood || 0) * .6, 1.2);
      const st = state.storm || 0;
      loopTo("amb_river", (state.river || 0) * .7, 1.5);
      loopTo("amb_storm", inside ? st * .1 : st * .5, 1);
      loopTo("amb_storm_in", inside ? st * .8 : 0, 1);
    }
    if (rec) {
      loopTo("amb_inside", (state.hum || 0) * .55);
      loopTo("amb_night", state.night ? state.night * .5 : 0);
      loopTo("amb_gym", (state.gym || 0) * .45);
      loopTo("amb_vent", (state.gym || 0) * .3);
    }
    tgt(amb.fire.g.gain, loopG.amb_fire ? 0 : (state.fire || 0) * (.05 + Math.random() * .05), t, .08);
    if (S.ambExtra) S.ambExtra(state, loopTo);
  };
  let drone = null;
  S.music = function(on, tense) {
    if (!S.ok) return;
    const t = S.ctx.currentTime;
    if (!drone) {
      const ctx = S.ctx;
      drone = {
        g: ctx.createGain()
      };
      drone.g.gain.value = 0;
      drone.g.connect(S.musBus);
      drone.o = [ 55, 82.4, 110.3 ].map((f, i) => {
        const o = ctx.createOscillator();
        o.type = i === 2 ? "triangle" : "sine";
        o.frequency.value = f;
        const lf = ctx.createOscillator();
        lf.frequency.value = .05 + i * .03;
        const lg = ctx.createGain();
        lg.gain.value = 1.5;
        lf.connect(lg);
        lg.connect(o.frequency);
        lf.start();
        const g = ctx.createGain();
        g.gain.value = i === 2 ? .25 : .5;
        o.connect(g);
        g.connect(drone.g);
        o.start();
        return o;
      });
    }
    const k = on && SX.bgm && SX.bgm.droneMul ? SX.bgm.droneMul() : 1;
    if (loopG.amb_drone) {
      drone.g.gain.setTargetAtTime(0, t, .5);
      loopTo("amb_drone", on ? .32 * k : 0, 1.8);
      loopTo("amb_rumble", on && tense ? .4 * k : 0, tense ? 1.2 : 3);
      return;
    }
    drone.g.gain.setTargetAtTime(on ? (tense ? .09 : .05) * k : 0, t, 1.5);
  };
  S.surfOf = function(fs) {
    const FS = SX.art && SX.art.FS;
    if (!FS) return "conc";
    if (fs === FS.WOOD || fs === FS.PARQ) return "wood";
    if (fs === FS.CARPET) return "carpet";
    if (fs === FS.TILE || fs === FS.HOSP || fs === FS.CHECK || fs === FS.LINO || fs === FS.MARBLE || fs === FS.LOBBY) return "tile";
    if (fs === FS.GRASS || fs === FS.DIRT) return "grass";
    if (fs === FS.WATER) return "water";
    return "conc";
  };
})(window.SX);
