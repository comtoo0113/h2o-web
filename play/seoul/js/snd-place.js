"use strict";

(function(SX) {
  const S = SX.audio;
  if (!S) return;
  const SP = SX.sndPlace = {
    on: true
  };
  const V = (base, n, r, v) => {
    const a = [];
    for (let k = 1; k <= n; k++) a.push([ base + "_" + k, r || 1, v == null ? 1 : v ]);
    return a;
  };
  const has = k => !!(S.bank && S.bank[k] && S.bank[k].length);
  const bank = {
    step_asph: V("step_asph", 6),
    step_terr: V("step_terr", 6),
    step_gravel: [ [ "step_grass_3", 1, 1 ], [ "step_grass_4", 1, 1 ], [ "step_grass_1", .94, 1 ], [ "step_grass_2", .94, 1 ] ],
    step_ballast: [ [ "step_grass_3", .86, 1 ], [ "step_grass_4", .86, 1 ], [ "step_grass_1", .82, 1 ], [ "step_grass_2", .84, 1 ] ],
    step_grit: V("step_grit", 3),
    step_stonemix: V("step_stone", 4),
    step_wetmix: V("step_water", 6, 1.08),
    hitWood: [ [ "hit_wood_1", 1, 1 ], [ "hit_wood_2", 1, 1 ], [ "hit_wood_3", 1, .8 ], [ "wood_hit", 1.05, .9 ] ],
    hitMetalP: [ [ "hit_metal_1", 1, 1 ], [ "hit_metal_2", 1, .8 ], [ "hit_metal_3", 1, .8 ], [ "metal_hit", 1, 1 ] ],
    hitGlass: [ [ "hit_glass_1", 1, 1 ], [ "hit_glass_1", 1.12, .9 ], [ "op_bottle", 1.2, .6 ] ],
    hitPlastic: V("hit_plastic", 3),
    hitFabric: [ [ "hit_fabric_1", 1, 1 ], [ "hit_fabric_2", 1, 1 ], [ "gym_punch_1", 1, .8 ], [ "gym_punch_2", 1, .8 ] ],
    hitSand: [ [ "hit_sand_1", 1, 1 ], [ "hit_sand_1", .9, 1 ], [ "wall_4", .85, .7 ] ],
    hitStone: [ [ "hit_stone_1", 1, 1 ], [ "wall_1", 1, 1 ], [ "wall_3", 1, .8 ] ],
    bumpWood: [ [ "wood_hit", 1.3, .6 ], [ "hit_wood_1", 1.2, .6 ] ],
    bumpMetal: [ [ "op_locker_1", 1.1, .7 ], [ "rattle_1", 1.15, .6 ], [ "sheet_1", 1, .5 ] ],
    bumpGlass: [ [ "op_bottle", 1.3, .5 ], [ "hit_glass_1", 1.4, .3 ] ],
    bumpPlastic: [ [ "hit_plastic_2", 1.1, .6 ], [ "hit_plastic_1", 1.2, .5 ] ],
    bumpFabric: [ [ "rustle_1", 1, .7 ], [ "rustle_2", 1, .7 ] ],
    bumpStone: [ [ "wall_2", 1.2, .4 ] ],
    rattleMetal: V("rattle", 3),
    sheetMetal: V("sheet", 2),
    monBeep: [ [ "mon_beep_1", 1, 1 ], [ "mon_beep_1", .94, .9 ] ],
    radioFar: [ [ "radio_chatter", 1, 1 ] ],
    sirenFar: V("siren_far", 3),
    blastFar: V("blast_far", 3),
    crowFar: [ [ "crow_1", 1, 1 ], [ "crow_2", 1, 1 ], [ "crow_3", 1, 1 ], [ "crow_1", .94, .9 ] ]
  };
  if (!has("step_lino")) bank.step_lino = [ [ "step_carpet_1", 1.12, 1 ], [ "step_carpet_2", 1.12, 1 ], [ "step_carpet_3", 1.1, 1 ], [ "step_carpet_4", 1.14, 1 ] ];
  if (!has("step_metal")) bank.step_metal = [ [ "stair_7", 1, 1 ], [ "stair_8", 1, 1 ], [ "stair_1", 1.05, .9 ], [ "stair_3", 1.05, .9 ] ];
  if (!has("step_rubber")) bank.step_rubber = [ [ "step_carpet_5", 1.05, 1 ], [ "step_carpet_6", 1.05, 1 ], [ "step_carpet_2", 1, 1 ] ];
  const gain = {
    step_asph: .42,
    step_terr: .42,
    step_gravel: .42,
    step_ballast: .44,
    step_grit: .3,
    step_stonemix: .26,
    step_wetmix: .2,
    step_lino: .36,
    step_metal: .42,
    step_rubber: .34,
    hitWood: .55,
    hitMetalP: .55,
    hitGlass: .5,
    hitPlastic: .5,
    hitFabric: .5,
    hitSand: .5,
    hitStone: .5,
    bumpWood: .4,
    bumpMetal: .4,
    bumpGlass: .35,
    bumpPlastic: .4,
    bumpFabric: .4,
    bumpStone: .35,
    rattleMetal: .4,
    sheetMetal: .35,
    monBeep: .35,
    radioFar: .4,
    sirenFar: .6,
    blastFar: .7,
    crowFar: .5
  };
  const cat = {
    step_asph: "step",
    step_terr: "step",
    step_gravel: "step",
    step_ballast: "step",
    step_grit: "step",
    step_stonemix: "step",
    step_wetmix: "step",
    step_lino: "step",
    step_metal: "step",
    step_rubber: "step",
    hitWood: "gun",
    hitMetalP: "gun",
    hitGlass: "gun",
    hitPlastic: "gun",
    hitFabric: "gun",
    hitSand: "gun",
    hitStone: "gun",
    rattleMetal: "amb",
    sheetMetal: "amb",
    monBeep: "amb",
    radioFar: "amb",
    sirenFar: "amb",
    blastFar: "amb",
    crowFar: "amb"
  };
  if (S.addSounds) S.addSounds({
    bank,
    gain,
    cat,
    steps: {
      asph: "step_asph",
      terr: "step_terr",
      gravel: "step_gravel",
      ballast: "step_ballast",
      wet: "step_tile",
      lino: "step_lino",
      metal: "step_metal",
      rubber: "step_rubber"
    },
    mix: {
      gravel: "step_grit",
      ballast: "step_stonemix",
      wet: "step_wetmix"
    }
  });
  for (const f of [ "amb_tunnel", "amb_site", "amb_school", "amb_hos" ]) if (S.loopNames && S.loopNames.indexOf(f) < 0) S.loopNames.push(f);
  SP.BANKS = Object.keys(bank);
  const TP = () => SX.texPlace;
  SP.SURF = {};
  {
    const M = (TP() || {}).MAT || {}, set = (s, ids) => {
      for (const k of ids) if (M[k]) SP.SURF[M[k]] = s;
    };
    set("lino", [ "JANG", "KVINYL", "VCT", "HVINYL", "HGREEN", "EPOXY", "STUDIO" ]);
    set("carpet", [ "CARPT", "CARPM", "CARPA", "CARPS" ]);
    set("wood", [ "SWOOD", "GYM", "LAM", "PLY", "OWOOD" ]);
    set("terr", [ "GRANITE", "TERR", "MALL", "BIGT", "PLAT", "OTERR" ]);
    set("tile", [ "BATH" ]);
    set("conc", [ "CONCB", "TACT", "TCONC", "PCONC", "MCONC", "BWALK", "RGREY", "PAVER", "ALLEY", "GPAVE" ]);
    set("gravel", [ "GRAVEL" ]);
    set("ballast", [ "BALLAST" ]);
    set("metal", [ "JOINT", "GRATE" ]);
    set("asph", [ "ROAD" ]);
    set("rubber", [ "CARF", "RGREEN" ]);
    set("grass", [ "YARD" ]);
    SP.WETTABLE = new Set([ "BATH", "MALL", "BIGT", "PLAT", "TCONC", "CONCB", "HVINYL", "VCT", "GRANITE", "TERR", "ROAD", "GRATE", "RGREEN", "RGREY" ].map(k => M[k]).filter(Boolean));
  }
  const baseSurf = S.surfOf;
  S.surfOf = function(fs) {
    const tp = TP();
    if (tp && tp.isMat(fs)) {
      const id = tp.idOf(fs);
      if (tp.vOf(fs) === 11 && SP.WETTABLE.has(id)) return "wet";
      return SP.SURF[id] || "conc";
    }
    const FS = SX.art && SX.art.FS;
    if (FS && (fs === FS.ASPH || fs === FS.LANE || fs === FS.CROSS)) return "asph";
    return baseSurf(fs);
  };
  SP.surfAt = (F, x, y) => S.surfOf(tp0(F, x, y));
  SP.casingOf = s => ({
    terr: "tile",
    lino: "tile",
    wet: "tile",
    rubber: "carpet",
    gravel: "grass",
    ballast: "grass",
    asph: "conc",
    metal: "conc"
  }[s] || s);
  const tp0 = (F, x, y) => {
    const tp = TP();
    if (tp) return tp.fsAt(F, x, y);
    const tx = Math.floor(x), ty = Math.floor(y);
    return F.in(tx, ty) ? F.fs[F.i(tx, ty)] : 0;
  };
  SP.fsAt = tp0;
  const OLD = {
    desk: "wood",
    table: "wood",
    diningTable: "wood",
    counter: "wood",
    crate: "wood",
    airdrop: "wood",
    bookshelf: "wood",
    workbench: "wood",
    gunRack: "wood",
    wardrobe: "wood",
    dresser: "wood",
    nightstand: "wood",
    cupboard: "wood",
    tree: "wood",
    bench: "wood",
    fire: "wood",
    boxes: "plastic",
    shelf: "metal",
    cabinet: "metal",
    locker: "metal",
    fridge: "metal",
    vending: "metal",
    drum: "metal",
    o2: "metal",
    opTable: "metal",
    ivStand: "metal",
    washer: "metal",
    car: "metal",
    bus: "metal",
    lamp: "metal",
    hydrant: "metal",
    plate: "metal",
    rangePlate: "metal",
    silh: "wood",
    ac: "metal",
    tank: "metal",
    zipline: "metal",
    escape: "metal",
    stash: "metal",
    radio: "metal",
    sign: "metal",
    atm: "metal",
    bigBoard: "metal",
    adBoard: "metal",
    safe: "metal",
    bed: "metal",
    bunkBed: "metal",
    singleBed: "fabric",
    doubleBed: "fabric",
    mattress: "fabric",
    sofa: "fabric",
    armchair: "fabric",
    clothes: "fabric",
    cot: "fabric",
    corpse: "fabric",
    bag: "fabric",
    partition: "fabric",
    punchBag: "fabric",
    rug: "fabric",
    rugBig: "fabric",
    sandbag: "sand",
    barrier: "stone",
    pillar: "stone",
    sink: "stone",
    toilet: "stone",
    bathtub: "stone",
    plant: "stone",
    bigPlant: "stone",
    trash: "plastic",
    copier: "plastic",
    board: "plastic",
    waterCooler: "plastic",
    waterStand: "plastic",
    chair: "plastic",
    tv: "glass",
    displayCase: "glass",
    displayShelf: "wood",
    shower: "glass",
    fishTank: "glass",
    microwave: "metal",
    kitchen: "wood"
  };
  SP.OLD_MAT = OLD;
  SP.matOf = kind => SX.art.PROP_MAT && SX.art.PROP_MAT[kind] || OLD[kind] || "stone";
  const HIT = {
    wood: "hitWood",
    metal: "hitMetalP",
    glass: "hitGlass",
    plastic: "hitPlastic",
    fabric: "hitFabric",
    sand: "hitSand",
    stone: "hitStone"
  };
  const BUMP = {
    wood: "bumpWood",
    metal: "bumpMetal",
    glass: "bumpGlass",
    plastic: "bumpPlastic",
    fabric: "bumpFabric",
    sand: "bumpFabric",
    stone: "bumpStone"
  };
  SP.HIT = HIT;
  SP.BUMP = BUMP;
  SP.hitOf = pr => pr && HIT[SP.matOf(pr.kind)] || "hitWall";
  SP.wallHit = function(F, x, y) {
    const tx = Math.floor(x), ty = Math.floor(y);
    if (!F || !F.in(tx, ty)) return "hitWall";
    const T = SX.map.T, t = F.t[F.i(tx, ty)];
    if (t === T.WINDOW) return "hitGlass";
    if (t === T.DOOR) return "hitWood";
    const tp = TP(), st = F.wst ? F.wst[F.i(tx, ty)] : 0;
    if (!tp || !st) return "hitWall";
    const W = tp.W;
    if (st === W.CORR || st === W.CONT || st === W.HOARD || st === W.CAR || st === W.SOFF) return "hitMetalP";
    if (st === W.WOODP) return "hitWood";
    if (st === W.STUD) return "hitFabric";
    return "hitWall";
  };
  SP.openOf = cont => {
    const p = cont && cont.prop, inf = p && SX.artPlace && SX.artPlace.INFO[p.kind];
    return inf && inf.open || null;
  };
  let bumpP = null, bumpT = 0;
  SP.bump = function(F, p, mx, my, moved) {
    const now = performance.now() / 1e3, l = Math.hypot(mx, my);
    if (!l || !F || !SX.actors) return;
    const ux = mx / l, uy = my / l, A = SX.actors;
    if (A.free(F, p.x + ux * .12, p.y + uy * .12)) {
      if (now - bumpT > .4) bumpP = null;
      return;
    }
    const tx = Math.floor(p.x + ux * .5), ty = Math.floor(p.y + uy * .5);
    if (!F.in(tx, ty)) return;
    const pr = F.propAt[F.i(tx, ty)];
    if (!pr || !pr.solid) {
      return;
    }
    if (pr === bumpP && now - bumpT < 1.2) {
      bumpT = now;
      return;
    }
    bumpP = pr;
    bumpT = now;
    S.play(BUMP[SP.matOf(pr.kind)] || "bumpStone", {
      vol: p.sprinting || p.sprint ? .9 : .6
    });
  };
  SP.peerStep = function(g, dt, F) {
    if (!F || !g || !SX.actors || !SX.actors.player || SX.actors.player.floor !== g.floor) return;
    g._sndT = (g._sndT || 0) - dt;
    if (g._sndT > 0) return;
    g._sndT = g.quiet ? .6 : g.sprinting ? .25 : .38;
    S.play("step", {
      x: g.x,
      y: g.y,
      foe: g.mate ? 0 : 1,
      range: g.quiet ? 4 : g.sprinting ? 16 : 10,
      vol: g.quiet ? .18 : g.sprinting ? .75 : .45,
      w: g.quiet ? .2 : g.sprinting ? .9 : .5,
      surface: S.surfOf(tp0(F, g.x, g.y))
    });
  };
  const PLACE_LOOPS = [ "amb_tunnel", "amb_site", "amb_school", "amb_hos" ];
  const next = {};
  const every = (k, a, b) => {
    const now = performance.now() / 1e3;
    if (next[k] == null) {
      next[k] = now + a + Math.random() * (b - a);
      return false;
    }
    if (now < next[k]) return false;
    next[k] = now + a + Math.random() * (b - a);
    return true;
  };
  SP.placeOf = lv => {
    const b = lv && lv.building || {};
    return b.outdoor === "site" ? "site" : b.outdoor === "tunnel" ? "tunnel" : b.outdoor ? "bridge" : b.id;
  };
  SP.ambWant = {};
  S.ambExtra = function(state, loopTo) {
    if (!SP.on) return;
    const G = SX.game, R = SX.raid, A = SX.actors, want = {
      amb_tunnel: 0,
      amb_site: 0,
      amb_school: 0,
      amb_hos: 0
    };
    const raid = G && G.state === "raid" && R && R.level && A && A.player;
    if (raid) {
      const lv = R.level, id = SP.placeOf(lv), p = A.player, inside = !!state.inside, near = d => ({
        x: p.x + (Math.random() - .5) * d,
        y: p.y + (Math.random() - .5) * d
      });
      if (id === "tunnel") {
        want.amb_tunnel = .6;
        if (every("tun", 14, 30)) {
          const q = near(40);
          S.play("rattleMetal", {
            x: q.x,
            y: q.y,
            range: 40,
            vol: .35,
            amb: 1,
            muffle: true
          });
        }
      } else if (id === "metro" && inside) want.amb_tunnel = .22; else if (id === "site") {
        want.amb_site = inside ? .15 : .45;
        if (!inside && every("site", 6, 14)) {
          const q = near(30);
          S.play(Math.random() < .6 ? "rattleMetal" : "sheetMetal", {
            x: q.x,
            y: q.y,
            range: 30,
            vol: .45,
            amb: 1
          });
        }
      } else if (id === "school" || id === "train") {
        if (inside) want.amb_school = .45;
      } else if (id === "hos") {
        if (inside) {
          want.amb_hos = .22;
          want.amb_school = .12;
          if (every("hos", 7, 15)) {
            const q = near(24);
            S.play("monBeep", {
              x: q.x,
              y: q.y,
              range: 22,
              vol: .5,
              amb: 1,
              muffle: true
            });
          }
        }
      } else if (id === "office" || id === "heli") {
        if (inside) want.amb_hos = .1;
      } else if (id === "base") {
        if (!inside) want.amb_site = .18; else if (every("base", 25, 45)) {
          const q = near(30);
          S.play("radioFar", {
            x: q.x,
            y: q.y,
            range: 26,
            vol: .4,
            amb: 1,
            muffle: true
          });
        }
      } else if (id === "bridge") {
        const rv = S.loopWant && S.loopWant.amb_river || 0, st = S.loopWant && S.loopWant.amb_storm || 0;
        loopTo("amb_river", Math.max(rv, .32), 1.5);
        loopTo("amb_storm", Math.max(st, .16), 1.5);
        if (every("gust", 12, 26)) S.play("gust", {
          vol: .35,
          amb: 1
        });
      }
    }
    const H = SX.hub, home = G && G.state === "hub" && H && (H.scene === "home" || H.scene === "visit") && H.level && A && A.player;
    if (home) {
      const kind = SX.homeOut && SX.homeOut.KIND[H.level.homeTier | 0] || "street", p = A.player;
      if (SP.homeTier !== (H.level.homeTier | 0)) for (const k in next) if (k.indexOf("home_") === 0) delete next[k];
      SP.homeKind = kind;
      SP.homeTier = H.level.homeTier | 0;
      const far = d => {
        const dx = (Math.random() - .5) * 16;
        return {
          x: p.x + dx,
          y: p.y + (Math.random() < .5 ? -1 : 1) * Math.sqrt(Math.max(0, d * d - dx * dx))
        };
      };
      const out = (name, k, a, b, d, vol) => {
        if (!every("home_" + k, a, b)) return;
        const q = far(d);
        SP.homeLast = {
          name,
          kind,
          t: performance.now()
        };
        S.play(name, {
          x: q.x,
          y: q.y,
          range: d + 30,
          vol,
          amb: 1,
          muffle: true,
          verb: name !== "crowFar"
        });
      };
      if (kind === "under") {
        if ((H.level.homeTier | 0) === 1) {
          out("dogBark", "dog", 40, 90, 40, .35);
          out("sirenFar", "siren", 120, 240, 50, .3);
        } else out("blastFar", "blast", 90, 180, 45, .4);
      } else if (kind === "roofs") {
        out("crowFar", "crow", 30, 70, 22, .4);
        out("sirenFar", "siren", 60, 140, 50, .35);
        out("blastFar", "blast", 120, 240, 50, .4);
      } else if (kind === "high") {
        out("sirenFar", "siren", 70, 150, 60, .35);
        out("blastFar", "blast", 100, 200, 55, .4);
      } else {
        out("sirenFar", "siren", 60, 140, 45, .35);
        out("dogBark", "dog", 50, 120, 40, .35);
        out("blastFar", "blast", 120, 240, 50, .4);
      }
    } else {
      SP.homeKind = SP.homeTier = null;
      for (const k in next) if (k.indexOf("home_") === 0) delete next[k];
    }
    for (const k of PLACE_LOOPS) {
      SP.ambWant[k] = want[k];
      loopTo(k, want[k], 1.5);
    }
  };
})(window.SX);
