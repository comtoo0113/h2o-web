"use strict";

(function(SX) {
  const S = SX.skills = {};
  S.MAX = 10;
  S.LIST = [ {
    id: "shoot",
    name: "사격",
    per: .015,
    k: 20,
    unit: "적을 맞힌 발",
    fx: "탄 퍼짐·반동"
  }, {
    id: "search",
    name: "뒤지기",
    per: .03,
    k: 4,
    unit: "다 뒤진 상자",
    fx: "뒤지는 시간"
  }, {
    id: "medic",
    name: "치료",
    per: .03,
    k: 1.5,
    unit: "쓴 약",
    fx: "약 쓰는 시간"
  }, {
    id: "stealth",
    name: "은신",
    per: .03,
    k: 8,
    unit: "조용히 걸은 초",
    fx: "발소리"
  } ];
  const def = id => S.LIST.find(q => q.id === id);
  const st = () => {
    const s = SX.game && SX.game.save;
    if (!s) return {};
    return s.skill || (s.skill = {});
  };
  S.xp = id => Math.max(0, +st()[id] || 0);
  S.need = (id, lv) => def(id).k * lv * lv;
  S.lv = id => {
    const d = def(id);
    if (!d) return 0;
    return Math.min(S.MAX, Math.floor(Math.sqrt(S.xp(id) / d.k) + 1e-9));
  };
  S.lvf = id => {
    const L = S.lv(id);
    if (L >= S.MAX) return S.MAX;
    const a = S.need(id, L), b = S.need(id, L + 1);
    return L + (S.xp(id) - a) / (b - a);
  };
  S.mul = id => {
    const d = def(id);
    return d ? 1 - d.per * S.lv(id) : 1;
  };
  S.gain = function(id, n, force) {
    const G = SX.game;
    if (!G || !G.save) return;
    if (!force && G.state !== "raid") return;
    const d = def(id);
    if (!d) return;
    const L0 = S.lv(id);
    if (L0 >= S.MAX) return;
    if (!force && SX.prog && SX.prog.ngXp) n *= SX.prog.ngXp(G.save.ng);
    st()[id] = Math.min(S.need(id, S.MAX), S.xp(id) + n);
    const L1 = S.lv(id);
    if (L1 > L0) S.upFx(d, L1);
  };
  if (SX.audio && SX.audio.addSounds) SX.audio.addSounds({
    bank: {
      skillUp: [ [ "bd_tb_g4", 1, 1 ] ],
      skillUp2: [ [ "bd_tb_c5", 1, 1 ] ]
    },
    gain: {
      skillUp: .42,
      skillUp2: .42
    },
    cat: {
      skillUp: "ui",
      skillUp2: "ui"
    }
  });
  S.upFx = function(d, L1) {
    const pct = Math.round(d.per * L1 * 1e3) / 10;
    SX.log("📈 숙련 — " + d.name + " " + L1 + "단계 (" + d.fx + " −" + pct + "%)", "good");
    if (SX.audio) {
      SX.audio.play("skillUp");
      SX.audio.play("skillUp2", {
        delay: .14
      });
    }
    if (SX.ui && SX.ui.bigNote && !(SX.game && SX.game.state === "raid")) SX.ui.bigNote("📈 " + d.name + " " + L1 + "단계", "숙련이 올랐습니다 — " + d.fx + " −" + pct + "%", 2e3);
  };
  S.TRAIN_PER_DAY = 3;
  S.fee = id => Math.round(15e4 * Math.pow(S.lv(id) + 1, 1.5) / 1e4) * 1e4;
  const today = () => {
    const d = new Date;
    return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
  };
  S.trainLeft = function() {
    const s = SX.game.save;
    if (s.trainDay !== today()) return S.TRAIN_PER_DAY;
    return Math.max(0, S.TRAIN_PER_DAY - (s.trainN | 0));
  };
  S.train = function(id, done) {
    const G = SX.game, s = G.save, d = def(id), fin = ok => {
      if (done) done(ok);
      return ok;
    };
    if (!d) return fin(false);
    if (G.inRaid && G.inRaid()) {
      SX.log("판 중엔 훈련을 못 합니다");
      return fin(false);
    }
    const L = S.lv(id);
    if (L >= S.MAX) {
      SX.log(d.name + " — 이미 끝 단계");
      SX.audio.play("denied");
      return fin(false);
    }
    if (!S.trainLeft()) {
      SX.log("오늘 훈련은 끝 — 교관이 내일 다시 오라고 합니다");
      SX.audio.play("denied");
      return fin(false);
    }
    const fee = S.fee(id);
    if (s.money < fee) {
      SX.log("돈이 모자랍니다 — " + SX.won(fee));
      SX.audio.play("denied");
      return fin(false);
    }
    const N = SX.net;
    if (N && N.on && N.on() && N.train) {
      (async () => {
        for (let k = 0; k < 60 && N.busy; k++) await new Promise(r => setTimeout(r, 100));
        let r = null;
        try {
          r = await N.train(id);
        } catch (e) {
          r = null;
        }
        const ok = !!(r && r.ok);
        if (ok) {
          SX.log("🎯 교관 훈련 — " + d.name + " (" + SX.won(fee) + ")", "good");
          const L1 = S.lv(id);
          if (L1 > L) S.upFx(d, L1);
          SX.ui && SX.ui.hudDirty && SX.ui.hudDirty();
        } else {
          if (N.unlogged && N.unlogged(r)) SX.log(r.msg, "bad");
          SX.audio.play("denied");
        }
        fin(ok);
      })();
      return null;
    }
    s.money -= fee;
    if (s.trainDay !== today()) {
      s.trainDay = today();
      s.trainN = 0;
    }
    s.trainN = (s.trainN | 0) + 1;
    const add = Math.max(1, (S.need(id, L + 1) - S.xp(id)) / 2);
    SX.log("🎯 교관 훈련 — " + d.name + " (" + SX.won(fee) + ")", "good");
    S.gain(id, add, true);
    G.persist();
    SX.ui && SX.ui.hudDirty && SX.ui.hudDirty();
    return fin(true);
  };
})(window.SX);
