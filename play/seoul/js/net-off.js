(function(SX) {
  "use strict";
  const NO = {
    ok: false,
    msg: "체험판에서는 쓸 수 없습니다"
  };
  const no = () => Promise.resolve(Object.assign({}, NO));
  const N = SX.net = {
    id: null,
    token: null,
    nick: null,
    acct: {},
    savedAt: 0,
    listings: [],
    lastMsg: "",
    busy: false,
    hold: false,
    q: false,
    skew: 0,
    online: 0,
    nowMax: 50,
    cureMin: 0,
    win: "trial",
    srv: "",
    srvUrl: "",
    on: () => false,
    saved: () => false,
    name: () => "",
    now: () => Date.now(),
    badOrigin: () => true,
    unlogged: () => false,
    nickAskOk: () => false,
    rejectedSaves: () => [],
    probe: () => Promise.resolve(false),
    restore: () => Promise.resolve(false),
    raidSnap() {},
    touch() {},
    aimLog() {},
    warnOther() {},
    hb() {},
    rejected() {}
  };
  for (const k of [ "login", "signup", "push", "pull", "market", "rank", "week", "buy", "sell", "feedback", "report", "call", "storyAct", "craft", "weekClaim", "garden", "facClaim", "logout", "sync", "stove", "setNick", "recover", "questClaim", "ngReset", "newCode", "keySwap", "facSell", "facBuild", "egStep", "dailyClaim", "deleteAccount", "changePw", "cancel", "barter", "gym", "train", "nickLater", "patch", "apply" ]) N[k] = no;
})(window.SX);
