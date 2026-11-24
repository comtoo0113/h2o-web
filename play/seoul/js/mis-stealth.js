(function(SX) {
  "use strict";
  const M = SX.mis, h = M.h;
  const st0 = s => s.k.stealth;
  const teamOf = id => {
    const R = h.R_();
    if (!R) return 0;
    if (id === R.me) return R.team;
    return R.teams && R.teams.has(id) ? R.teams.get(id) : -1;
  };
  const myTeam = () => teamOf(h.me());
  const holds = (s, id, qid) => id === h.me() ? M.mine(qid) : !!(s.have.get(id) && s.have.get(id).ids.indexOf(qid) >= 0);
  function teamHolds(s, tm, qid) {
    if (tm === myTeam() && M.mine(qid)) return true;
    for (const [id, v] of s.have) if (teamOf(id) === tm && v.ids.indexOf(qid) >= 0) return true;
    return false;
  }
  const cnt = (R, tm) => R.c[String(tm)] | 0;
  function apply(s, R, tm, n, who) {
    const k = String(tm), was = R.c[k] | 0;
    if (who != null && !R.w[k]) R.w[k] = who;
    if (n <= was) return;
    R.c[k] = n;
    if (who == null) who = R.w[k];
    if (tm !== myTeam()) return;
    if (M.mine(R.id)) {
      const st = M.state(R.id);
      if (st && !st.fail && !st.ok) M.fail(R.id, who != null && who !== h.me() ? "들켰습니다(" + h.nameOf(who) + ")" : "들켰습니다");
    }
    if (SX.ui && SX.ui.hudDirty) SX.ui.hudDirty();
  }
  M.K.stealth = {
    setup(s) {
      const q = SX.prog.MIS_Q.find(x => x.kind === "stealth" && x.b === s.b);
      if (!q) return null;
      return {
        id: q.id,
        c: {},
        w: {},
        bark: 0
      };
    },
    trk(s, q) {
      const R = st0(s);
      if (!R || R.id !== q.id) return null;
      return {
        t: q.name + " — 들키지 않고 탈출 · 들킴 " + cnt(R, myTeam()),
        p: "들킴 " + cnt(R, myTeam())
      };
    },
    okText: () => "한 번도 들키지 않았습니다",
    spotted(s, e, tg) {
      const R = st0(s);
      if (!R || !tg || !tg.player || !h.isAuth()) return;
      const who = tg.peer != null ? tg.peer : h.me(), tm = teamOf(who);
      if (!teamHolds(s, tm, R.id)) return;
      const n = cnt(R, tm) + 1;
      apply(s, R, tm, n, who);
      M.sendK("stealth", {
        q: "sp",
        tm,
        n,
        who
      });
    },
    onMsg(s, from, d) {
      const R = st0(s);
      if (!R) return;
      if (d.q === "sp" && typeof d.n === "number" && isFinite(d.n)) apply(s, R, d.tm, Math.min(999, d.n | 0), d.who);
    },
    onPeer(s, from) {
      const R = st0(s);
      if (R && h.isAuth() && h.R_()) for (const k of Object.keys(R.c)) M.sendK("stealth", {
        q: "sp",
        tm: isNaN(+k) ? k : +k,
        n: R.c[k],
        who: R.w[k]
      }, from);
    },
    dump(s) {
      const R = st0(s);
      return {
        c: R.c,
        w: R.w
      };
    },
    worldIn(s, w) {
      const R = st0(s);
      if (!R || !w || !w.c) return;
      for (const k of Object.keys(w.c)) apply(s, R, isNaN(+k) ? k : +k, w.c[k] | 0, w.w && w.w[k] != null ? w.w[k] : null);
    },
    onEnd(s, win) {
      const R = st0(s);
      if (!R || !win || !M.mine(R.id)) return;
      const st = M.state(R.id);
      if (!st || st.fail || st.ok) return;
      if (cnt(R, myTeam()) > 0) return;
      M.ok(R.id, "한 번도 들키지 않고 나옴", false);
    }
  };
})(window.SX);
