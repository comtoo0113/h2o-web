(function(SX) {
  "use strict";
  const M = SX.mis, h = M.h;
  const NEAR = 6, REACH = 1.7, TAKE_T = 2;
  const PREF = {
    영안실: {
      th: [ "surgery", "store", "none", "pantry" ],
      low: true
    },
    전광판: {
      th: [ "concourse", "platform" ],
      low: true,
      wall: true,
      open: true
    }
  };
  function roomOk(F, r, open) {
    if (!r) return false;
    if (!open) return h.okRoom(F, r);
    if (r.vault || r.ctrl || F.vault && F.vault.r === r || F.ctrl && F.ctrl.r === r) return false;
    return !h.stairIn(F, r);
  }
  function spotIn(F, r, wall) {
    const T = h.T_();
    if (wall) {
      for (let x = r.x0 + 1; x <= r.x1 - 1; x++) {
        const y = r.y0;
        if (F.tile(x, y - 1) === T.WALL && h.freeT(F, x, y) && h.freeT(F, x, y + 1) && !h.nearDoor(F, x, y)) return {
          x: x + .5,
          y: y + .5
        };
      }
    }
    const cx = (r.x0 + r.x1) / 2, cy = (r.y0 + r.y1) / 2, c = [];
    for (let y = r.y0; y <= r.y1; y++) for (let x = r.x0; x <= r.x1; x++) if (h.freeT(F, x, y) && !h.nearDoor(F, x, y)) c.push([ Math.hypot(x - cx, y - cy), x, y ]);
    if (!c.length) return null;
    c.sort((a, b) => a[0] - b[0] || a[2] - b[2] || a[1] - b[1]);
    return {
      x: c[0][1] + .5,
      y: c[0][2] + .5
    };
  }
  function pick(lv, rng, q) {
    const top = Math.max(1, lv.building.floors | 0), pf = PREF[q.spot] || {};
    let fl = [];
    for (let f = 0; f < top; f++) fl.push(f);
    fl = rng.shuffle(fl);
    if (pf.low) fl.sort((a, b) => Math.min(a, 2) - Math.min(b, 2));
    for (const pass of [ 0, 1, 2 ]) {
      for (const f of fl) {
        const F = lv.floors[f];
        if (!F || !F.rooms) continue;
        for (const r of rng.shuffle(F.rooms.slice())) {
          if (pass === 0 && (!pf.th || pf.th.indexOf(r.theme) < 0)) continue;
          if (!roomOk(F, r, pf.open || pass === 2) || h.area(r) < 6) continue;
          const sp = spotIn(F, r, pf.wall && pass < 2);
          if (!sp) continue;
          return {
            id: q.id,
            spot: q.spot,
            f,
            x: sp.x,
            y: sp.y,
            room: r
          };
        }
      }
    }
    return null;
  }
  const spots = s => s.k.photo ? s.k.photo.list : [];
  const spotOf = (s, id) => spots(s).find(v => v.id === id) || null;
  const live = (s, sp) => M.mine(sp.id) && (() => {
    const st = M.state(sp.id);
    return st && !st.ok && !st.fail;
  })();
  const near = (sp, p, d) => p && p.floor === sp.f && Math.hypot(p.x - sp.x, p.y - sp.y) <= d;
  M.K.photo = {
    setup(s, lv, rng) {
      const list = [];
      for (const q of SX.prog.MIS_Q) if (q.kind === "photo" && q.b === s.b) {
        const sp = pick(lv, rng, q);
        if (sp) list.push(sp);
      }
      return list.length ? {
        list
      } : null;
    },
    trk(s, q) {
      const sp = spotOf(s, q.id);
      if (!sp) return {
        t: q.name + " — 이 판에는 찍을 곳이 없습니다"
      };
      const p = h.A_().player;
      return {
        t: q.spot + " 사진 — " + (near(sp, p, NEAR) ? "가까이 왔습니다 · 표시한 곳에서 [" + h.key() + "] 2초" : h.fname(sp.f) + " 어딘가")
      };
    },
    okText: (s, q) => "사진 찍음",
    target(s, F, p, put) {
      for (const sp of spots(s)) {
        if (sp.f !== F.idx || !live(s, sp)) continue;
        const d = Math.hypot(sp.x - p.x, sp.y - p.y);
        if (d > REACH) continue;
        put({
          kd: "photo",
          id: sp.id,
          x: sp.x,
          y: sp.y - .9,
          label: "📷 " + sp.spot + " 사진 찍기 — [" + h.key() + "] 2초 누르고 있기"
        }, [ sp.x - .5, sp.y - 1, sp.x + .5, sp.y + .4 ], d);
      }
    },
    interact(s, t) {
      const sp = spotOf(s, t.id);
      if (!sp || !live(s, sp) || M.jobOn()) return;
      M.job({
        k: "ph",
        T: TAKE_T,
        hold: true,
        pose: "ph",
        keep: .5,
        label: left => "📷 " + sp.spot + " 찍는 중 … " + left.toFixed(1),
        ok: () => live(s, sp),
        done: () => {
          const p = h.A_().player, F = s.lv.floors[p.floor];
          M.flash();
          SX.audio.play("shutter", {
            x: p.x,
            y: p.y,
            range: 8,
            vol: .9
          });
          if (F) h.A_().noise(F, p.x, p.y, 4);
          M.ok(sp.id, "「" + sp.spot + "」 사진을 찍었습니다", true);
        }
      });
    },
    marks(s, out) {
      const p = h.A_().player;
      for (const sp of spots(s)) if (live(s, sp) && near(sp, p, NEAR)) out.push({
        f: sp.f,
        x: sp.x,
        y: sp.y,
        col: "rgb(255,214,120)",
        label: "📷 " + sp.spot
      });
    },
    pois(s, f, o) {
      const p = h.A_().player;
      for (const sp of spots(s)) if (sp.f === f && live(s, sp) && near(sp, p, NEAR)) o.push({
        kind: "ping",
        x: sp.x,
        y: sp.y
      });
    }
  };
})(window.SX);
