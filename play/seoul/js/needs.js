"use strict";

(function(SX) {
  const N = SX.needs = {};
  N.FOOD = {
    참치캔: [ 30, 0 ],
    "햄 통조림": [ 35, -5 ],
    "통조림 복숭아": [ 18, 12 ],
    "건빵 봉지": [ 25, -8 ],
    봉지라면: [ 28, -5 ],
    "끓인 라면": [ 60, 10 ],
    "매운 라면": [ 28, -8 ],
    "된장 라면": [ 28, -5 ],
    "우동 라면": [ 30, -5 ],
    "김치 한 포기": [ 15, 0 ],
    꿀단지: [ 22, 0 ],
    "커피믹스 한 통": [ 3, 8 ],
    생수병: [ 0, 40 ],
    탄산수: [ 0, 30 ],
    이온음료: [ 0, 45 ],
    우유팩: [ 8, 25 ],
    주스팩: [ 5, 28 ],
    "청주 한 병": [ 5, 10 ],
    "소주 두 병": [ 5, 8 ],
    "광고 음료캔": [ 2, 32 ],
    "광고 사이다": [ 3, 38 ],
    "광고 과자": [ 18, -6 ],
    "광고 초코바": [ 14, -2 ],
    상추: [ 10, 6 ],
    고추: [ 4, -3 ],
    방울토마토: [ 6, 8 ],
    감자: [ 14, 0 ],
    배추: [ 12, 4 ],
    "삶은 감자": [ 40, 5 ],
    "채소 샐러드": [ 26, 22 ]
  };
  Object.assign(N.FOOD, SX.FISH_FOOD || {});
  N.of = it => {
    const v = it && N.FOOD[it.name];
    return v ? {
      f: v[0],
      w: v[1]
    } : null;
  };
  N.get = function(s) {
    s = s || SX.game && SX.game.save;
    if (!s) return {
      food: 100,
      water: 100
    };
    if (s.food == null) s.food = 100;
    if (s.water == null) s.water = 100;
    return s;
  };
  const RATE_F = 1.5 / 40, RATE_W = 1.5 / 25, LOW = 25;
  N.LOW = LOW;
  N.tick = function(dt, p) {
    const G = SX.game;
    if (!G || G.state !== "raid" || !p || !p.alive || G.god || p.down) return;
    const s = N.get(G.save), f0 = s.food, w0 = s.water;
    s.food = Math.max(0, s.food - RATE_F * dt);
    s.water = Math.max(0, s.water - RATE_W * dt * (p.sprinting ? 1.5 : 1));
    if (f0 >= LOW && s.food < LOW) SX.log("🍞 배가 고픕니다 — 기력이 천천히 찹니다(먹을 것 우클릭)", "warn");
    if (w0 >= LOW && s.water < LOW) SX.log("💧 목이 마릅니다 — 달리면 기력이 빨리 닳습니다(마실 것 우클릭)", "warn");
    if (f0 > 0 && s.food <= 0) SX.log("🍞 굶주렸습니다 — 체력이 조금씩 줄어듭니다", "bad");
    if (w0 > 0 && s.water <= 0) SX.log("💧 탈수 — 체력이 조금씩 줄어듭니다", "bad");
    if (s.food <= 0 || s.water <= 0) {
      p.hp -= .15 * dt;
      if (SX.recap) SX.recap.tick("hunger", .15 * dt);
      if (p.hp <= 0) SX.actors.playerZero(s.water <= 0 ? "탈수로 쓰러졌습니다" : "굶주려 쓰러졌습니다");
    }
    if ((f0 | 0) !== (s.food | 0) || (w0 | 0) !== (s.water | 0)) SX.ui && SX.ui.hudDirty && SX.ui.hudDirty();
  };
  N.stRegenMul = () => {
    const s = N.get();
    return s.food < LOW ? .7 : 1;
  };
  N.sprintMul = () => {
    const s = N.get();
    return s.water < LOW ? 1.3 : 1;
  };
  N.eat = function(s, it) {
    const v = N.of(it);
    if (!v) return false;
    s = N.get(s);
    s.food = Math.max(0, Math.min(100, s.food + v.f));
    s.water = Math.max(0, Math.min(100, s.water + v.w));
    SX.audio && SX.audio.play(v.w > v.f ? "drink" : "eatFx", {
      vol: .8
    });
    const parts = [];
    if (v.f) parts.push("배고픔 " + (v.f > 0 ? "+" : "") + v.f);
    if (v.w) parts.push("목마름 " + (v.w > 0 ? "+" : "") + v.w);
    SX.log("🍽 " + it.name + " — " + parts.join(" · ") + " (배 " + Math.round(s.food) + " · 물 " + Math.round(s.water) + ")", "good");
    SX.ui && SX.ui.hudDirty && SX.ui.hudDirty();
    return true;
  };
  N.MEALS = [ {
    id: "water",
    name: "생수 한 통",
    price: 6e4,
    f: 0,
    w: 50,
    desc: "목마름 +50"
  }, {
    id: "gukbap",
    name: "국밥 한 그릇",
    price: 25e4,
    f: 60,
    w: 15,
    desc: "배고픔 +60 · 목마름 +15"
  }, {
    id: "set",
    name: "백반 정식",
    price: 7e5,
    f: 100,
    w: 100,
    desc: "배고픔·목마름 가득"
  } ];
  N.buyMeal = function(id) {
    const G = SX.game, s = N.get(G.save), m = N.MEALS.find(q => q.id === id);
    if (!m) return false;
    if (G.inRaid && G.inRaid()) return false;
    if ((s.food >= 99.5 || !m.f) && (s.water >= 99.5 || !m.w)) {
      SX.log("배부릅니다 — 지금은 안 먹어도 됩니다");
      SX.audio.play("denied");
      return false;
    }
    if (s.money < m.price) {
      SX.log("돈이 모자랍니다 — " + SX.won(m.price));
      SX.audio.play("denied");
      return false;
    }
    s.money -= m.price;
    s.food = Math.min(100, s.food + m.f);
    s.water = Math.min(100, s.water + m.w);
    SX.audio.play("buy");
    SX.log("🍲 " + m.name + " — " + m.desc + " (배 " + Math.round(s.food) + " · 물 " + Math.round(s.water) + ")", "good");
    G.persist();
    SX.ui && SX.ui.hudDirty && SX.ui.hudDirty();
    return true;
  };
  N.TAKEAWAY = [ [ "생수병", 14 ], [ "이온음료", 14 ], [ "참치캔", 13 ], [ "봉지라면", 13 ], [ "건빵 봉지", 13 ], [ "광고 음료캔", 13 ], [ "광고 과자", 13 ] ];
})(window.SX);
