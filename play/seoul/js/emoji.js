"use strict";

(function(SX) {
  const A = SX.art;
  const E = SX.emo = {};
  const MAP = E.MAP = {
    "🛗": "lift",
    "🧑": "person",
    "📷": "camera",
    "✏": "pencil",
    "✎": "pencil",
    "🌊": "wave",
    "⛔": "noentry",
    "🔩": "bolt",
    "🧱": "brick",
    "🙋": "raisehand",
    "🆘": "sos",
    "★": "star",
    "⭐": "star",
    "☆": "starO",
    "✓": "check",
    "✔": "check",
    "✅": "checkBox",
    "⚠": "warn",
    "🔒": "lock",
    "🔓": "unlock",
    "🔑": "key",
    "🗝": "key",
    "⛓": "chain",
    "💀": "skull",
    "☠": "skullX",
    "🌐": "globe",
    "🎒": "bag",
    "🚁": "heli",
    "💬": "chat",
    "🏠": "house",
    "🏡": "house",
    "🏚": "ruin",
    "🏢": "building",
    "🏪": "shop",
    "🛡": "shield",
    "🤝": "hands",
    "🛰": "sat",
    "🎯": "target",
    "🎓": "grad",
    "🔥": "fire",
    "💰": "money",
    "🏋": "barbell",
    "🔍": "magnify",
    "🔎": "magnify",
    "🔁": "cycle",
    "🔄": "cycle",
    "🧹": "broom",
    "🎣": "rod",
    "🏅": "medal",
    "🎖": "ribbon",
    "🏆": "trophy",
    "🏁": "flag",
    "🚩": "redflag",
    "📦": "box",
    "🎁": "gift",
    "🛠": "tools",
    "🚿": "shower",
    "🗺": "map",
    "👊": "fist",
    "📜": "scroll",
    "🔋": "battery",
    "📋": "clip",
    "💊": "pill",
    "💉": "syringe",
    "🧪": "flask",
    "🧺": "basket",
    "🧽": "sponge",
    "🐟": "fish",
    "🐠": "fish",
    "👥": "people",
    "🏷": "tag",
    "🍲": "pot",
    "🍳": "pan",
    "🍽": "plate",
    "🎮": "pad",
    "🌱": "sprout",
    "🥬": "veg",
    "🥀": "wilt",
    "📢": "horn",
    "📣": "horn",
    "📻": "radio",
    "📈": "chart",
    "✂": "scissors",
    "🚪": "door",
    "🔪": "knife",
    "🗡": "dagger",
    "🔫": "gun",
    "🧟": "zombie",
    "🗑": "trash",
    "💡": "bulb",
    "🌙": "moon",
    "☀": "sun",
    "🛋": "sofa",
    "🛒": "cart",
    "📌": "pin",
    "🧗": "climb",
    "🎆": "flare",
    "♾": "inf",
    "🎨": "palette",
    "📅": "calendar",
    "📆": "calendar",
    "💪": "muscle",
    "⏳": "hourglass",
    "⌛": "hourglass",
    "📖": "book",
    "🧩": "puzzle",
    "🔊": "speaker",
    "🔈": "speaker",
    "🖥": "pc",
    "💻": "pc",
    "🟫": "soil",
    "💧": "hud/water",
    "🦠": "hud/virus",
    "⏱": "hud/clock",
    "⏰": "hud/clock",
    "👁": "hud/eye",
    "🩸": "hud/bleed",
    "🔧": "hud/wrench",
    "🌧": "hud/rain",
    "🌫": "hud/fog",
    "⛈": "hud/storm",
    "⚡": "hud/bolt/#ffd84a",
    "🍞": "hud/food",
    "🔐": "hud/safe",
    "🟢": "hud/nvg",
    "♥": "hud/heart",
    "❤": "hud/heart",
    "🩹": "hud/medkit",
    "🧰": "hud/medkit"
  };
  const KEEP = new Set([ ..."▶◀▲▼▸◂▴▾↔↕↖↗↘↙↩↪⤴⤵⬅➡⬆⬇⏩⏪⏫⏬⏭⏮⏯⏸⏹⏺▪▫◻◼◽◾■□▣▮▯©®™‼⁉ℹ〰〽✕" ]);
  const PAL0 = "k1c1d22 K3a3d45 d5d626b g8b9199 Gb7bdc5 we4e2da Wffffff Rd6403a r96282a Pff8f80 Oef8a2b ob25c1d Yf5c53a ybe8822 Lfff09c N62b649 n3b7a2f Made27b B4886d6 b2b5898 C98d0f7 Ta76f39 t6c4523 Ud7a96a Sf1c193 sc6895a V9969cf v634399";
  const PX = {
    pencil: [ "", "................/................/.............PRr/............PRRr/...........GGGg./..........LYYy../.........LYYy.../........LYYy..../.......LYYy...../......LYYy....../.....LYYy......./....LYYy......../...TTt........../..kt............/.k............../................" ],
    lift: [ "", "................/..KKKKKKKKKKKK../..KdddYddYYYdK../..KddYYYddYddK../..KKKKKKKKKKKK../..KwGGGddwGGgK../..KwGGGddwGGgK../..KwGGGddwGGgK../..KwGGGddwGGgK../..KwGGGddwGGgK../..KwGGGddwGGgK../..KwGGGddwGGgK../..KwGGGddwGGgK../..KddddddddddK../..KKKKKKKKKKKK../..KKKKKKKKKKKK.." ],
    person: [ "", "................/......kkkk....../.....kttttk...../....ktTTTTtk..../....ktTTTTtk..../....ktSSSStk..../....kSkSSkSk..../....kSSSSSSk..../.....ksSSsk...../......kssk....../...kkNNNNNNkk.../..kNNNNNNNNNNk../..kNNNnNNnNNNk../..kNNNnNNnNNNk../..kkkkkkkkkkkk../................" ],
    camera: [ "", "................/................/................/.....KKKK..KKK../....KdggdK.KRK../.KKKKKKKKKKKKKK./.KggggGGGGggwwK./.KdddGbbbbGdddK./.KddGbBCBBbGddK./.KddGbBBBBbGddK./.KddGbBBBBbGddK./.KdddGbbbbGdddK./.KddddGGGGddddK./.KKKKKKKKKKKKKK./.KKKKKKKKKKKKKK./................" ],
    wave: [ "", "................/................/................/......WWCC....../....WCCBBBC...../...WCBBbbBBC..../..WCBBb..WBC..../..CBBb....b...../.CBBb.........../.CBBBC...WWCC.../.BBBBBCWCCBBBC../.BBBBBBBBBBBBBC./.bBBBBBBBBBBBBb./..bbbbbbbbbbbb../................/................" ],
    noentry: [ "", "................/.....PRRRRr...../...PRRRRRRRRr.../..PRRRRRRRRRRr../..RRRRRRRRRRRr../.PRRRRRRRRRRRRr./.RRWWWWWWWWWWRr./.RRWWWWWWWWWWRr./.RRRRRRRRRRRRRr./..RRRRRRRRRRRr../..rRRRRRRRRRRr../...rRRRRRRRRr.../.....rrrrrr...../................/................/................" ],
    bolt: [ "", "................/..GGGg........../.GWGGGg........./.GGGGGgd......../.gGGGGgd......../..ggggdd......../....dGGd......../.....dGgd......./......dGGd....../.......dGgd...../........dGGd..../.........dGgd.../..........dGGd../...........dGd../............dd../................" ],
    brick: [ "", "................/................/.gggggggggggggg./.gPRRRRgPRRRRRg./.grrrrrgrrrrrrg./.gggggggggggggg./.gPRRgPRRRRRgPg./.grrrgrrrrrrgrg./.gggggggggggggg./.gPRRRRgPRRRRRg./.grrrrrgrrrrrrg./.gggggggggggggg./.gPRRgPRRRRRgPg./.grrrgrrrrrrgrg./.gggggggggggggg./................" ],
    raisehand: [ "", "................/...........SS.../..........SSs.../....ttt...Ss..../...tTTTt..Ss..../...tSSSs..Ss..../...SkSkS.Ss...../...SSSSs.Ss...../....SsS.BBb...../..BBBBBBBBb...../.BBBBBBBBBb...../.BBbBBBBBbb...../.BB.BBBBBb....../.SS.BBBBBb....../....bbbbbb....../................" ],
    sos: [ "", "................/................/................/................/.PRRRRRRRRRRRRr./.RRWWWRWWWRWWWr./.RRWRRRWRWRWRRr./.RRWWWRWRWRWWWr./.RRRRWRWRWRRRWr./.RRWWWRWWWRWWWr./.RRRRRRRRRRRRRr./.rrrrrrrrrrrrrr./................/................/................/................" ],
    star: [ "", "................/.......L......../.......L......../......LYy......./......LYy......./.LLLLLLYYYYYYy../..LYYWYYYYYYy.../...LYYYYYYYy..../....YYYYYYy...../....YYYYYyy...../...YYYy.YYyy..../...YYy...Yyy..../..Yy.......yy.../..y.........y.../................/................" ],
    starO: [ "", "................/.......Y......../.......Y......../......YKy......./......YKy......./.YYYYYKKKYYYYy../..YKKKKKKKKKy.../...YKKKKKKKy..../....YKKKKKy...../....YKKyKKy...../...YKKy.yKKy..../...YYy...yyy..../..Yy.......yy.../..y.........y.../................/................" ],
    check: [ "", "................/................/................/............MN../...........MNn../..........MNn.../.........MNn..../........MNn...../..MN....MNn...../..MNN..MNn....../...MNNMNn......./....MNNn......../.....Nn........./................/................/................" ],
    checkBox: [ "", "................/................/...MMMMMMMMMn.../..MNNNNNNNNNNn../..MNNNNNNNWWNn../..MNNNNNNWWwNn../..MNWWNNWWwNNn../..MNwWWWWwNNNn../..MNNwWWNNNNNn../..MNNNWwNNNNNn../..MNNNNNNNNNNn../..MNNNNNNNNNNn../..nNNNNNNNNNNn../...nnnnnnnnnn.../................/................" ],
    warn: [ "", "................/.......LY......./......LYYy....../......LYYy....../.....LYkkYy...../.....LYkkYy...../....LYYkkYYy..../....LYYkkYYy..../...LYYYkkYYYy.../...LYYYYYYYYy.../..LYYYYkkYYYYy../..LYYYYkkYYYYy../.LYYYYYYYYYYYYy./.yyyyyyyyyyyyyy./................/................" ],
    lock: [ "", "................/................/......GGGG....../.....GG..Gg...../....GG....gg..../....GG....gg..../....GG....gg..../...LLLLLLLLLy.../...LYYYkkYYYy.../...LYYYkkYYYy.../...LYYYddYYYy.../...LYYYYYYYYy.../...LYYYYYYYYy.../...yyyyyyyyyy.../................/................" ],
    unlock: [ "", "................/...GGGG........./..GG..Gg......../.GG....gg......./.GG....gg......./.......gg......./.......gg......./...LLLLLLLLLy.../...LYYYkkYYYy.../...LYYYkkYYYy.../...LYYYddYYYy.../...LYYYYYYYYy.../...LYYYYYYYYy.../...yyyyyyyyyy.../................/................" ],
    key: [ "", "................/................/................/................/................/..LYYy........../.LY..Yy........./.Y....YLLLLLLLy./.Y....Yyyyyyyyy./.yY..yy...yy.yy./..yyyy....yy..../................/................/................/................/................" ],
    chain: [ "", "................/................/................/................/..GGGg....GGGg../.GG..gg..GG..gg./.G....g..G....g./.G...WGGGGG...g./.G...dddddd...g./.G....g..G....g./.gg..gg..gg..gg./..gggg....gggg../................/................/................/................" ],
    skull: [ "", "................/................/.....WWwwww...../...wWWwwwwwwg.../..wWwwwwwwwwwg../..wwwwwwwwwwwg../..wwkkkwwkkkwg../..wwkkkwwkkkwg../..wwwkkwwkkwwg../...gwwwkkwwwg.../....wwwwwwwg..../....wkwkwkwk..../....gwgwgwgg..../................/................/................" ],
    skullX: [ "", "................/.....Wwwwww...../....wWwwwwwg..../....wkkwwkkg..../....wkkwwkkg..../.....wwkkwg...../.....wkwkwk...../.w....gggg....w./.www........www./...www....www.../.....wwwwww...../.....gggwww...../...ggg....www.../.ggg........www./.g............w./................" ],
    globe: [ "", "................/.....BCCCBb...../....BCBCBCBb..../...CCCCCCCCCb.../..BBWBBCBBCBBb../.BBCBBBCBBBCBBb./.BBCBBBCBBBCBBb./.CCCCCCCCCCCCCb./.BBCBBBCBBBCBBb./.BBCBBBCBBBCBBb./.bBCBBBCBBBCBBb./..bCCCCCCCCCCb../...bCBBCBBCBb.../....bCBCBCBb..../.....bbbbbb...../................" ],
    bag: [ "A7c8c46 Q5f6d34 Za9ba6a a4e5a2a", "................/......tttt....../.....t....t...../....ZZZZZZZZ..../...ZAAAAAAAAa.../..ZAQQQQQQQQAa../..ZAQQQQQQQQAa../..ZAaaaUUaaaAa../..ZAAAAUUAAAAa../..ZAAZZZZZZAAa../..ZAAZAAAAQAAa../..ZAAZAAAAQAAa../..ZAAQQQQQQAAa../..aaAAAAAAAAaa../...aaaaaaaaaa.../................" ],
    heli: [ "H5e7d4c J88aa72 h3c5532", "................/................/.KKKKKKKKKKKKK../.......K......../.....JJJJJ....../...JJHHHHHHH..../..JCCHHHHHHHHHHh/..JCCWHHHHHHHHhh/..HCCHHHHHHHh..K/..HHHHHHHHHh...K/...hHHHHHHh...../....hhhhhh....../....K....K....../..KKKKKKKKKK..../................/................" ],
    chat: [ "", "................/................/...WWWWWWWWWW.../..WwwwwwwwwwwG../.WwwwwwwwwwwwwG./.WwwwwwwwwwwwwG./.Wwwddwwddwwddg./.Wwwddwwddwwddg./.WwwwwwwwwwwwwG./..wwwwwwwwwwwG../...wwGGGGGGGG.../...wwG........../..wwG.........../..wG............/................/................" ],
    house: [ "", "................/.......PR......./......PRRr....../.....PRRRRr...../....PRRRRRRr..../...PRRRRRRRRr.../..PRRRRRRRRRRr../.rrrrrrrrrrrrrr./...UwwwwwwwwU.../...UwTTwwCCwU.../...UwTTwwCbwU.../...UwTTwwwwwU.../...UwTYwwwwwU.../...UwTTwwwwwU.../...UUttUUUUUU.../................" ],
    ruin: [ "E7d6a58 Fa8957e e54463a", "................/........E......./.......EEe....../....F.EEEEe...../...FEEEE.EEe..../..FEEEE...EEe.../.eeeeee....eee../...gGGGGGGGGg.../...gGTTTTGGGg.../...gGtkTtGKGg.../...gGTTkTGGdg.../...gGGGGGGGGg.../...gGddGGdGGg.../...gGddGGGGGg.../...ggddggggdg.../................" ],
    building: [ "", "................/...GGGGGGGGGd.../...Gggggggggd.../...GgCggCgCgd.../...GgBggBgBgd.../...Gggggggggd.../...GgCggCgCgd.../...GgBggBgBgd.../...Gggggggggd.../...GgCggCgCgd.../...GgBggBgBgd.../...Gggggggggd.../...GgggdKgggd.../...GgggKKgggd.../...GgggKKgggd.../................" ],
    shop: [ "", "................/................/..RRwwRRwwRRww../.RRwwRRwwRRwwRr./.rRRwwRRwwRRwwr./..rrrrrrrrrrrr../..UwwwwwwwwwwU../..UCCCCwwTTTwU../..UCWCCwwTTTwU../..UCCCBwwTTTwU../..UbbbbwwTYTwU../..UwwwwwwTTTwU../..UwwwwwwTTTwU../..ttttttttttttt./................/................" ],
    shield: [ "H8ea9c6 Jc4d6ea h5a7392", "................/...JJJJJJJJJJ.../..JHHHHHHHHHHh../..JHHHHBBHHHHh../..JHHHHBBHHHHh../..JHHBBBBBBHHh../..JHHBBBBBBHHh../..JHHHHBBHHHHh../...JHHHBBHHHh.../...JHHHBBHHHh.../....JHHHHHHh..../.....hHHHHh...../......hHHh....../.......hh......./................/................" ],
    hands: [ "X3c74c4 Zd8742c x284e8a z9a4c1a", "................/................/................/.......SS......./XX....SSSs....ZZ/XXX..SSSSSSS.ZZz/XXXSSSsSSSSSSZZz/XXxSSSSsSsSsSZzz/XxxsSSSSsSsSsZzz/xxx.SSSSSsSsZzz./xx...sSSSSss.zz./......ssss....../................/................/................/................" ],
    sat: [ "", "................/.......g......../.......G......../......GGg......./.BBBB.YYY.BBBB../.BCBBgYLYg.CBBb./.BBBBgYYYgBBBBb./.bBbBgYYyg.bBbb./.BBBBgyyyg.BBBb./.bbbb.ggg.bbbb../......dGd......./.....dG.Gd....../................/................/................/................" ],
    target: [ "", "................/.....PPPPPr...../....PRRRRRRr..../...PRwwwwwwRr.../..PRwwRRRRwwRr../.PRwwRRRRRRwwRr./.PRwRRwwwwRRGRr./.PRwRRwRRwRRGRr./.PRwRRwRRwRRGRr./.PRwRRwwwGRRGRr./.rRwwRRRRRRGGRr./..rRwwRRRRGGRr../...rRwGGGGGRr.../....rRRRRRRr..../.....rrrrrr...../................" ],
    grad: [ "", "................/................/................/.......dd......./.....ddKKdd...../...ddKKKKKKdd.../.dKKKKKYYYYYKKd./...dKKKKKKKKKY../.....dKKKKd..Y../....kkkkkkkk.Y../....kKKkkkkk.Y../....kKkkkkkkYYy./....kkkkkkkkYYy./.....kkkkkk...../................/................" ],
    fire: [ "", "................/......R........./......RR......../.....RRR...R..../.....RORR..RR.../....RROORRRRR.../...RROOOORORRR../...ROOOYOOOORR../..RROOYYOOOOORr./..ROOYYLYYOOORr./..ROOYLLLYYOORr./..rROYLLLLYOORr./...rROYLLYOORr../....rrOOOORrr.../......rrrr....../................" ],
    money: [ "", "................/......tTt......./.....tUUUt....../......tTt......./.....UUUUUt...../....UUUUUUUt..../...UUUUtUUUUt.../..UUUUtttUUUUt../..UUUUtUUUUUUt../..UUUUUtttUUUt../..UUUUUUUtUUUt../..UUUUtttUUYYYy./..tUUUUtUUYLYYy./...ttttttYYYYYy./..........yyyy../................" ],
    barbell: [ "", "................/................/................/..dK......dK..../.GdKK....GdKK.../.GdKK....GdKK.../.GdKK....GdKK.../GGdKKGGGGGdKKGGg/ggdKKggggddKKggg/.GdKK....GdKK.../.GdKK....GdKK.../.gdKK....gdKK.../..dK......dK..../................/................/................" ],
    magnify: [ "", "................/....GGGGg......./...GCCCCCg....../..GCWWCCCCg...../..GCWCCCCCg...../..GCCCCCCCg...../..GCCCCCCBg...../..gCCCCCBBg...../...gBBBBBg....../....ggggggT...../.........tTT..../..........tTT.../...........tTT../............tt../................/................" ],
    cycle: [ "", "................/................/..........M...../...MMMMMMMNM..../..MNNNNNNNNNM.../.MNn......NNn.../.MN.......Nn..../.MN.......n...../.....N.......Nn./....nN.......Nn./...nNN......nNn./...NNNNNNNNNNn../....nNnnnnnnn.../.....n........../................/................" ],
    broom: [ "", "................/............Tt../...........Tt.../..........Tt..../.........Tt...../........Tt....../.......Tt......./......RRr......./.....LRRrY....../....LYYYYYy...../...LYYyYYyy...../..LYyYYyYy....../.LYYyYyYy......./.YyYyYyy......../..y.y.y........./................" ],
    rod: [ "", "................/............TG../...........T..G./..........T...G./.........T....G./........T.....G./.......T......G./......t.......G./.....tt.......G./....tt.......CBB/...tt.......CBBb/..tK.......CWBb./.tK.........Bbb./.K..........b.b./................/................" ],
    medal: [ "", "................/..BBb....RRr..../..BBBb..RRRr..../...BBBbRRRr...../....BBRRRr....../.....yYYy......./....LYYYYy....../...LYYLYYYy...../...YYLLLYYy...../...YYYLYYyy...../...YYYYYYyy...../....YYyyyy....../.....yyyy......./................/................/................" ],
    ribbon: [ "", "................/....RRwBBwRR..../....RRwBBwRR..../....RRwBBwRR..../....RRwBBwRR..../....rrrrrrrr..../.......Yy......./......LYYy....../...LLLLYYYYYy.../....LYYYYYYy..../.....YYYYYy...../.....YYyYYy...../....YYy..Yyy..../....yy....yy..../................/................" ],
    trophy: [ "", "................/..LLLLLLLLLLYy../.Y.LYYYYYYYYy.y./.Y.LYYYYYYYYy.y./.Y.LYYYYYYYYy.y./..YLYYYYYYYYyy../....LYYYYYYy..../.....YYYYyy...../......YYyy....../.......Yy......./.......Yy......./.....LYYYYy...../....TTTTTTTt..../....TUUUUUTt..../....ttttttttt.../................" ],
    flag: [ "", "................/.G............../.GkkWWkkWWkk..../.GkkWWkkWWkkW.../.GWWkkWWkkWWk.../.GWWkkWWkkWWkk../.GkkWWkkWWkkWW../.GkkWWkkWWkkWW../.GWWkkWWkkWWkk../.G....WWkkWWkk../.G............../.G............../.G............../.G............../.g............../................" ],
    redflag: [ "", "................/..G............./..GPRRR........./..GRRRRRRR....../..GRRRRRRRRRR.../..GRRRRRRRRRRr../..GRRRRRRRRr..../..GRRRRrrr....../..Grrr........../..G............./..G............./..G............./..G............./..G............./.ggg............/................" ],
    box: [ "", "................/................/....LUUUUUUUUU../...LUUUwwUUUUTt./..LUUUwwUUUUTtt./.LUUUwwUUUUTttt./.UTTTwwTTTTTttt./.UTTTwwTTTTTttt./.UTTTwwTTTTTttt./.UTTTwwTTTTTttt./.UTTTwwTTTTTtt../.UTTTwwTTTTTt.../.ttttttttttt..../................/................/................" ],
    gift: [ "", "................/....YY...YY...../...Y..Y.Y..Y..../....YY.Y.YY...../..PRRRRYYRRRRr../..RRRRRYYRRRRr../..rrrrrYyrrrrr../...RRRRYYRRRr.../...RRRRYYRRRr.../...RRRRYYRRRr.../...RRRRYYRRRr.../...RRRRYYRRRr.../...rrrryyrrrr.../................/................/................" ],
    tools: [ "", "................/..GG.......dKKd./.Gg........dKKKd/.G..g.......dKKd/.GG.Gg.....Tt.d./..GGGGg...Tt..../....GGGg.Tt...../.....gGGTt....../......TtGG....../.....Tt.gGG...../....Tt...gGG..../...Tt.....gGG.../..Tt.......gGG../.tt.........gg../................/................" ],
    shower: [ "", "................/.........GGGGg../........Gg...g../.......Gg....g../......GGGg....../.....GGGGGg...../....GGGGGGGg..../...ddddddddd..../................/...C..C..C....../..C..C..C..C..../...C..C..C....../..C..C..C..C..../...C..C..C....../................/................" ],
    map: [ "Ed9cfa3 Fc2b688 ea89a6c", "................/................/.EEEEFFFFEEEE.../.ENNEFFCCEEEEe../.ENNEFCCFENEEe../.EEEEFFFFENNEe../.ERREFFFFEEEEe../.EEREFRRFEEEEe../.EEERRFRRRERRe../.EEEEFFFFEERRe../.ENEEFCFFEEEEe../.EEEEFCCFENNEe../.eeeeFFFFeeeee../................/................/................" ],
    fist: [ "", "................/................/....SSSSSSSS..../...SWSSsSSsSs.../...SSSSsSSsSs.../...SSSSsSSsSs.../...sssssssssss../..SSSSSSSSSSSs../..SSSSSSSSSSss../..SSssSSSSSSs.../...sSSssSSSs..../....SSSSSSs...../....BBBBBBb...../....BBBBBBb...../....bbbbbbb...../................" ],
    scroll: [ "Ee8dcb0 Fcfc090 eb8a878", "................/..eEEEEEEEEEe.../.eEFFEEEEEEEEe../.eEeeEEEEEEEe.../..eeEEEEEEEEe.../....EeeeeeeE..../....EEEEEEEE..../....EeeeeeEE..../....EEEEEEEE..../....EeeeeeeE..../....EEEEEEEE..../..eEEEEEEEEEe.../.eEFFEEEEEEEEe../.eEeeEEEEEEEe.../..eeeeeeeeee..../................" ],
    battery: [ "", "................/................/................/................/.GGGGGGGGGGGG.../.GkkkkkkkkkkGg../.GkMNkMNkMNkGgg./.GkNNkNNkNNkGgg./.GkNnkNnkNnkGgg./.GkkkkkkkkkkGg../.gggggggggggg.../................/................/................/................/................" ],
    clip: [ "", "................/......GGGG....../..TTTGdkkdGTTt../..TwwwGGGGwwTt../..TwwwwwwwwwTt../..TwddddddwwTt../..TwwwwwwwwwTt../..TwddddddddTt../..TwwwwwwwwwTt../..TwdddddwwwTt../..TwwwwwwwwwTt../..TwddddddwwTt../..TwwwwwwwwwTt../..tttttttttttt../................/................" ],
    pill: [ "", "................/...........Pr.../.........PPRRr../........PRRRRRr./.......PRRRRRRr./......PRRRRRRr../.....WwRRRRRRr../....WwwwRRRRr.../...WwwwwwRRr..../..Wwwwwwwwr...../..WwwwwwwG....../.WwwwwwwG......./.GwwwwwG......../..GwwGG........./...GG.........../................" ],
    syringe: [ "", "................/.GG............./.GGg............/..ggG.........../....GG........../.....wWw......../....wCCwW......./.....wCCCwW...../......wCCCCw..../.......wCCCCw.../........wCCCw.../.........wwwg.../...........g..../............g.../.............g../................" ],
    flask: [ "", "................/..........GGG.../.........GwwG.../........GwwG..../.......GwwG...../......GwwG....../.....GMMG......./....GMNNG......./...GMNNG......../..GMNNnG......../..GNNnG........./..GnnG........../...GG.........../................/................/................" ],
    basket: [ "", "................/................/.....TTTTT....../....T.....t...../...T.......t..../...T.......t..../.UUUUUUUUUUUUUt./.TUTUTUTUTUTUTt./..UTUTUTUTUTUt../..TUTUTUTUTUTt../..UTUTUTUTUTUt../...TUTUTUTUTt.../...UUUUUUUUUt.../....tttttttt..../................/................" ],
    sponge: [ "", "................/................/................/..MMMMMMMMMMM.../..MNNNNNNNNNNn../..NnnnnnnnnnNn../..LLLLLLLLLLLy../..LYYyYYYYyYYy../..LYYYYyYYYYYy../..LYyYYYYYyYYy../..LYYYYYyYYYYy../..LYYyYYYYYYyy../...yyyyyyyyyy.../................/................/................" ],
    fish: [ "", "................/................/................/......CCCC....../....CBBBBBB...B./...CBBBBBBBB.BB./..CBkWBBBBBBBBb./..BBBBBBBBBBBbb./..BBBBCCCCCbBbb./...bCCCCCCbb.bb./....bbCCCbb...b./......bbbb....../................/................/................/................" ],
    people: [ "H8fd0ff J6a86a8 h5a9ac8 j465a74", "................/................/..........JJ..../.........JJJj.../....HH...JJJj.../...HWHh...jj..../...HHHh..JJJJ.../....hh..JJJJJj../...HHHH.JJJJJj../..HHHHHHhJJJJj../..HHHHHHhJJJJj../.HHHHHHHHhjjjj../.HHHHHHHHh....../.hhhhhhhhh....../................/................" ],
    tag: [ "Ef2d27a Ffff0b8 ec09a44", "................/................/.......FFFF...../......FEEEEe..../.....FEE..Ee..../....FEEE..Eed.../...FEEEEEEEe.d../..FEEEEEEEEe..d./.FEEEEEEEEe...d./.eEEEEEEEe....d./..eEEEEEe......./...eEEEe......../....eEe........./.....e........../................/................" ],
    pot: [ "", "................/....G...G......./.....G...G....../....G...G......./................/..OOOOOOOOOOO.../GGOLOOROOOOOoGG./G.GGGGGGGGGGd.g./..GddddddddGd.../..GGGGGGGGGGd.../..GGGGGGGGGGd.../..GGGGGGGGGGd.../...gggggggggg.../................/................/................" ],
    pan: [ "", "................/................/................/...KKKKKKK....../..KdwwwwwdK...../.KdwwWwwwwdK..../.KwwwYYwwwwK..../.KwwYLYYwwwKtttt/.KwwYYYywwwKtTTt/.KdwwYywwwdK.tt./..KdwwwwwdK...../...KKKKKKK....../................/................/................/................" ],
    plate: [ "", "................/................/.G.G.....wwww..G/.G.G...wwGGGGw.G/.GGG..wGGwwwwGwG/..G..wGwwwwwwwGG/..G..wGwwwwwwwGG/..G..wGwwwwwwwGg/..G..wGwwwwwwwG./..G..wGwwwwwwGgg/..G...wGGwwwGg.g/..g....wwGGGg..g/..g......gggg..g/................/................/................" ],
    pad: [ "", "................/................/................/................/...GGGGGGGGGG.../..GgggggggggGg../.GgdgggggggRgGg./.GdddggggggggBg./.GgdgggKKgNggGg./.GggggKKKKggggd./.Ggggd....dgggd./..ddd......ddd../................/................/................/................" ],
    sprout: [ "", "................/................/.........MMM..../..MMM...MNNNn.../.MNNNn.MNNNn..../.nNNNNMNNnn...../..nnNNNnn......./......N........./......N........./......n........./...UUUnUUUU...../..UTTTTTTTTt..../..TTtTTTtTTt..../...tttttttt...../................/................" ],
    veg: [ "", "................/.....MM.MM....../....MNNMNNn...../...MNNNNNNNn..../...NNnNNnNNn..../..MNNNNNNNNNn.../..NNNnNNNnNNn.../..nNNNNNNNNNn.../...nNwNwNwNn..../....wwwwwwG...../....wwWwwwG...../....wwwwwwG...../.....wwwwG....../......GGG......./................/................" ],
    wilt: [ "Hb04a3c Jd4705e h702c26", "................/................/.....nnnnn....../....nNNNNNn...../...nNn....Nn..../...nN......Nn.../...nN.....JHHh../...nN....JHHHHh./.NNnN....HHJHHh./..NnN....hHHHhh./...nN.....hhhh../...nN.........../...nN.......JH../...nN.......hh../..nnnn........../................" ],
    horn: [ "", "................/................/...........RR.../.........RRRr.../.......RRRwRr.../.GG..RRRwwwRr.../.GGRRRwwwwwRr.../.GGRRwwwwwwRr.../.GGRRRwwwwwRr.../.gg..RRRwwwRr.../...g...RRRwRr.../...gg....RRRr.../...........rr.../................/................/................" ],
    radio: [ "", "................/............G.../...........G..../..........G...../.........G....../..TTTTTTTTTTTt../..TKdKdKdTwwTt../..TdKdKdKTRwTt../..TKdKdKdTwwTt../..TdKdKdKTGGTt../..TKdKdKdTGgTt../..TTTTTTTTTTTt../..tttttttttttt../...K........K.../................/................" ],
    chart: [ "", "................/................/.wwwwwwwwwwwwww./.wGwwwwwwwwwNNw./.wGwwwwwwwwNNNw./.wGwwwwwwwNNwww./.wGwwwwwwNNwwww./.wGwwNwwNNwwwww./.wGwNNNNNwwwwww./.wGNNwNNwwwwwww./.wGNwwwwwwwwwww./.wGGGGGGGGGGGGw./.gggggggggggggg./................/................/................" ],
    scissors: [ "", "................/.G...........G../.GG.........GG../..GG.......Gg.../...GG.....Gg..../....GG...Gg...../.....GG.Gg....../......GKg......./.....RRgRR....../....RR....RR..../...R..R..R..R.../...R..R..R..R.../....RR....RR..../................/................/................" ],
    door: [ "", "................/...dddddddddd.../...dTTTTTTTTd.../...dTUUUUUUTd.../...dTUTTTTUTd.../...dTUTTTTUTd.../...dTUUUUUUTd.../...dTTTTTTYTd.../...dTUUUUUUTd.../...dTUTTTTUTd.../...dTUTTTTUTd.../...dTUUUUUUTd.../...dTTTTTTTTd.../..dddddddddddd../................/................" ],
    knife: [ "", "................/............W.../...........WGg../..........WGGg../.........WGGg.../........WGGg..../.......WGGg...../......WGGg....../.....WGGg......./....gGgg......../...KKg........../..KKK.........../.KKK............/.KK............./................/................" ],
    dagger: [ "", "................/.......W......../......WGg......./......WGg......./......WGg......./......WGg......./......WGg......./......WGg......./...YYYYYYYy...../....yyTyyy....../......Tt......../......Tt......../......Tt......../.....YYy......../................/................" ],
    zombie: [ "Z8fa56b z5d7046", "................/.....kkkkk....../....kZZZZZk...../...kZZZZZZzk..../...kZRZZRZzk..../...kZZZZZZzk..../...kZzkkkzzk..../....kzZZZzk...../..kkbBBBBbkkkkk./.kBBBBBBBBZZZZzk/.kbBBbBBBkkkkkk./.kZkBBBbBBk...../..kkbBBbBbk...../...kKKKKKKk...../...kKKk.kKk...../...kkk..kkk....." ],
    gun: [ "", "................/................/................/................/..GGGGGGGGGGGGg./..GKKKKKKKKKKKd./..dKKKKKKKKKKKd./..ddKKKdKddddd../...dKKKd.d....../...dKKKddd....../..dKKKd........./..dKKKd........./..ddddd........./................/................/................" ],
    trash: [ "", "................/......gggg....../..GGGGGGGGGGGg../..dddddddddddd../...GgGgGgGgGd.../...GgGgGgGgGd.../...GgGgGgGgGd.../...GgGgGgGgGd.../...GgGgGgGgGd.../...GgGgGgGgGd.../...GgGgGgGgGd.../...GgGgGgGgGd.../....dddddddd..../................/................/................" ],
    bulb: [ "", "................/.....LLLLL....../....LWLYYYY...../...LWLYYYYYy..../...LLYYYYYYy..../...LYYYYYYYy..../...LYYYYYYYy..../....YYYYYYy...../.....YYYYy....../.....GGGGg....../.....dddd......./.....GGGGg....../......ddd......./................/................/................" ],
    moon: [ "", "................/.....LLLL......./...LLYYy......../..LYYy........../..LYy.........../.LYY............/.LYy............/.LYy............/.LYY............/.LYYy.........../..YYYy.......y../..yYYYYy...yy.../...yyYYYYyyy..../.....yyyyy....../................/................" ],
    sun: [ "", "................/.......OO......./.......OO......./...O........O.../....OLLLLLOO..../....LYYYYYYO..../....LYWYYYYO..../.OO.LYYYYYYO.OO./.OO.LYYYYYYO.OO./....LYYYYYYO..../....OYYYYYYO..../....OOOOOOOO..../...O........O.../.......OO......./.......OO......./................" ],
    sofa: [ "Hb0503e Jd07462 h7a3428", "................/................/................/....JJJJJJJJ..../...JHHHHHHHHh.../...JHHHHHHHHh.../.JJJHHHHHHHHhJJ./JHHJHHHHHHHHhHHh/JHHJJJJJJJJJJHHh/JHHHHHHHHHHHHHHh/JHHHHHHHHHHHHHHh/.hhhhhhhhhhhhhh./..t..........t../................/................/................" ],
    cart: [ "", "................/................/K.............../.Kd............./..dGGGGGGGGGGGg./..dG.G.G.G.G.Gd./...GGGGGGGGGGd../...dG.G.G.G.Gd../....GGGGGGGGd.../....d.......d.../....ddddddddd.../.....K.....K..../....KdK...KdK.../.....K.....K..../................/................" ],
    pin: [ "", "................/........PRR...../.......PRRRr..../........RRr...../........RRr...../......PRRRRr..../.....PRRRRRRr.../....rrrrrrrrr.../.......g......../......g........./.....g........../....g.........../...g............/................/................/................" ],
    climb: [ "", "................/.......GG......./......G..G....../......G.gG....../.....TUGGTt...../....TTTTTUTt..../...UUUUttUUTt.../..UTTTt..tUTUt../..TTUt....tTUt../..TUt......UUt../..UUTt....UUTt../..tUTUt..TTTTt../...tTUUTUUUUt.../....tTUTTTTt..../.....tttttt...../................" ],
    flare: [ "", "................/.......Y......../..R....Y....R.../...R...Y...R..../....R..L..R...../.....R.L.R....../......LWL......./.YYYLLWWWLLYYY../......LWL......./.....O.L.O....../....O..L..O...../...O...Y...O..../..O....Y....O.../.......Y......../................/................" ],
    inf: [ "", "................/................/................/................/...CCC....CCC.../..C...C..C...C../.C.....CC.....C./.C.....CC.....C./.B.....BB.....B./..B...B..B...B../...BBB....BBB.../................/................/................/................/................" ],
    palette: [ "", "................/................/.....UUUUUU...../...UURRUUUUUt.../..UUURRUUYYUUt../.UUUUUUUUYYUUt../.UNNUUUUUUUUBBt./.UNNUUU..UUUBBt./.UUUUU....UUUUt./.UUVVUU..UUUUt../..UVVUUUUUUUt.../...UUUUUUUtt..../....ttttttt...../................/................/................" ],
    calendar: [ "", "................/...G.....G....../..RGRRRRRGRr..../..RRRRRRRRRr..../..wwwwwwwwwG..../..wdwdwdwdwG..../..wwwwwwwwwG..../..wdwdwRwdwG..../..wwwwwwwwwG..../..wdwdwdwdwG..../..wwwwwwwwwG..../..GGGGGGGGGG..../................/................/................/................" ],
    muscle: [ "", "................/........SSSS..../.......SWSSSs.../.......SSSSSs.../........sSSs..../........SSSs..../....SSS.SSSs..../...SWSSSSSSs..../..SSSSSSSSSSs.../BBSSSSSSSSSSs.../BBSSSSSSSSSSs.../BbsSSSSSSSSs..../bb.sssssssss..../................/................/................" ],
    hourglass: [ "", "................/..TTTTTTTTTTt.../...tttttttt...../...CwwwwwwC...../....CYYYYC....../.....CYYC......./......CY......../......YC......../.....CwYC......./....CwYYwC....../...CwYYYYwC...../...tttttttt...../..TTTTTTTTTTt.../................/................/................" ],
    book: [ "", "................/................/................/..www......www../.Wwwwwwg.gwwwwwG/.WwddwwGgwddwwwG/.Wwwwwwg.gwwwwwG/.WwddwwG.Gwddwwg/.WwwwwwG.Gwwwwwg/.WwddwwG.Gwddwwg/.WwwwwwGgGwwwwwg/.TTTTTTTTTTTTTTt/..tttttt.ttttttt/................/................/................" ],
    puzzle: [ "", "................/.....MMMn......./....MNNNNn....../.....MNNn......./......NN......../...MMMMMMMn...../...MNNNNNNn...../...MNNNNNNn.MN../......NNNNNNNNn./......NNNNNNNNn./...MNNNNNNn.Nn../...MNNNNNNn...../...nnnnnnnn...../................/................/................" ],
    speaker: [ "", "................/................/.......G....C.../......GG..C..C../.....GgG...C..C./..GGGggG.C..C.C./..GddggG..C.C..C/..GddggG..C.C..C/..GddggG..C.C..C/..gggggG.C..C.C./.....ggG...C..C./......gG..C..C../.......g....C.../................/................/................" ],
    pc: [ "", "................/................/.GGGGGGGGGGGGGg./.GkkkkkkkkkkkKd./.GkBBBBBBBBBkKd./.GkBCCBBBBBBkKd./.GkBCBBBBBBBkKd./.GkBBBBBBBBbkKd./.GkbbbbbbbbbkKd./.GkkkkkkkkkkkKd./.ddddddddddddd../......GGd......./......Ggd......./....GGGGGGd...../................/................" ],
    spark: [ "", "................/................/................/.......L......../.......L......../......LYy......./...LLLYWYyyy..../......LYy......./.......y......../.......y......../................/................/................/................/................/................" ],
    soil: [ "E8a6040 Fa87a52 e5c3e28", "................/................/................/................/................/................/.....FFFFFF...../...FFEEEEEEEe.../..FEEeEEEEeEEe../.FEEEEEEeEEEEEe./.FEeEEEEEEEeEEe./.eeeeeeeeeeeeee./................/................/................/................" ]
  };
  const pal = s => {
    const o = {};
    for (const t of s.split(" ")) if (t) o[t[0]] = "#" + t.slice(1);
    return o;
  };
  const BASE = pal(PAL0);
  function paint(P, key) {
    const d = PX[key], cs = Object.assign({}, BASE, pal(d[0])), rows = d[1].split("/");
    for (let y = 0; y < rows.length; y++) for (let x = 0; x < rows[y].length; x++) {
      const ch = rows[y][x];
      if (ch !== ".") P.p(x, y, cs[ch]);
    }
  }
  E.keys = () => Object.keys(PX);
  E.icon = function(key) {
    if (key.startsWith("hud/")) {
      const q = key.split("/");
      return A.hud(q[1], q[2]);
    }
    if (!PX[key]) key = "spark";
    return A.cached("emo" + key, 16, 16, P => paint(P, key), {
      sel: true
    });
  };
  const URLS = new Map;
  E.url = key => {
    let u = URLS.get(key);
    if (!u) {
      u = E.icon(key).toDataURL("image/png");
      URLS.set(key, u);
    }
    return u;
  };
  const cls = key => key.replace(/[^a-z0-9]/gi, "-");
  const QUICK = /[\u00A9\u00AE\u203C\u2049\u2122\u2139\u2190-\u21FF\u2300-\u23FF\u24C2\u25A0-\u27BF\u2934\u2935\u2B00-\u2BFF\u3030\u303D\u3297\u3299\uD83C-\uD83E]/;
  const RE = /(?:[\u{1F1E6}-\u{1F1FF}]{1,2}|\p{Extended_Pictographic}|[\u2605\u2606\u2713])[\uFE0E\uFE0F]?\p{Emoji_Modifier}?(?:\u200D\p{Extended_Pictographic}[\uFE0E\uFE0F]?\p{Emoji_Modifier}?)*/gu;
  const keyOf = E.keyOf = m => {
    const c = String.fromCodePoint(m.codePointAt(0));
    if (KEEP.has(c)) return null;
    return MAP[c] || "spark";
  };
  E.has = s => {
    if (typeof s !== "string" || !QUICK.test(s)) return false;
    RE.lastIndex = 0;
    let m;
    while (m = RE.exec(s)) if (keyOf(m[0])) return true;
    return false;
  };
  E.strip = s => {
    if (!E.has(s)) return s;
    RE.lastIndex = 0;
    return s.replace(RE, m => keyOf(m) ? "\0" : m).replace(/\u0000 ?/g, "").replace(/^\s+/, "");
  };
  function split(s) {
    if (!QUICK.test(s)) return null;
    RE.lastIndex = 0;
    let m, last = 0;
    const out = [];
    while (m = RE.exec(s)) {
      const k = keyOf(m[0]);
      if (!k) continue;
      out.push(s.slice(last, m.index), k, m[0]);
      last = m.index + m[0].length;
    }
    if (!out.length) return null;
    out.push(s.slice(last));
    return out;
  }
  E.split = split;
  const st = document.createElement("style");
  st.id = "emoCss";
  st.textContent = "sx-e{display:inline-block;width:calc(var(--u)*8);height:calc(var(--u)*8);width:max(calc(var(--u)*8),round(down,1.5em,calc(var(--u)*8)));height:max(calc(var(--u)*8),round(down,1.5em,calc(var(--u)*8)));" + "vertical-align:middle;margin:calc(var(--u)*-1) 0;background:no-repeat center/100% 100%;image-rendering:pixelated;overflow:hidden;line-height:0;color:transparent!important;text-shadow:none!important;flex:none;pointer-events:none;font-style:normal;}sx-c{font-size:0!important;line-height:0!important;}";
  (document.head || document.documentElement).appendChild(st);
  const ruled = new Set;
  function rule(key) {
    if (ruled.has(key)) return;
    ruled.add(key);
    try {
      st.sheet.insertRule("sx-e.emo-" + cls(key) + '{background-image:url("' + E.url(key) + '")}', st.sheet.cssRules.length);
    } catch (e) {}
  }
  try {
    document.documentElement.style.setProperty("--emo-star", 'url("' + E.url("star") + '")');
  } catch (e) {}
  E.el = function(key, ch) {
    rule(key);
    const e = document.createElement("sx-e"), c = document.createElement("sx-c");
    e.className = "emo-" + cls(key);
    c.textContent = ch || "";
    e.appendChild(c);
    return e;
  };
  const SKIP = /^(SCRIPT|STYLE|TEXTAREA|INPUT|CANVAS|NOSCRIPT|SX-E|SX-C|OPTION|TITLE|SELECT)$/, PLAIN = /^(OPTION|TITLE|SELECT)$/;
  function fixText(n, flex) {
    if (n._emoK) {
      if (n.nodeValue === n._emoTo) return;
      for (const k of n._emoK) if (k.parentNode) k.remove();
      n._emoK = null;
    }
    const v = n.nodeValue;
    if (!v || !QUICK.test(v)) return;
    const p = n.parentNode;
    if (!p || p.nodeType !== 1 || p.isContentEditable) return;
    if (SKIP.test(p.nodeName)) {
      if (PLAIN.test(p.nodeName)) {
        const s = E.strip(v);
        if (s !== v) n.nodeValue = s;
      }
      return;
    }
    const sp = split(v);
    if (!sp) return;
    let host = p, ref = n.nextSibling;
    if (flex == null ? isFlex(p) : flex) {
      host = document.createElement("sx-r");
      p.insertBefore(host, n);
      host.appendChild(n);
      ref = null;
    }
    const kids = [];
    for (let i = 1; i < sp.length; i += 3) {
      const e = E.el(sp[i], sp[i + 1]);
      host.insertBefore(e, ref);
      kids.push(e);
      if (sp[i + 2]) {
        const t = document.createTextNode(sp[i + 2]);
        host.insertBefore(t, ref);
        kids.push(t);
      }
    }
    n.nodeValue = sp[0];
    n._emoTo = sp[0];
    n._emoK = kids;
  }
  const isFlex = p => /flex|grid/.test(getComputedStyle(p).display);
  const ATTRS = [ "title", "placeholder" ];
  function fixAttr(el) {
    for (const a of ATTRS) {
      const v = el.getAttribute(a);
      if (v && QUICK.test(v)) {
        const s = E.strip(v);
        if (s !== v) el.setAttribute(a, s);
      }
    }
  }
  function walk(root) {
    if (!root) return;
    if (root.nodeType === 3) return fixText(root);
    if (root.nodeType !== 1 || root.nodeName === "SX-E") return;
    if (root.hasAttribute("title") || root.hasAttribute("placeholder")) fixAttr(root);
    if (!QUICK.test(root.textContent || "")) {
      if (root.querySelector("[title],[placeholder]")) for (const e of root.querySelectorAll("[title],[placeholder]")) fixAttr(e);
      return;
    }
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
      acceptNode: n => n.nodeType === 1 && /^(SCRIPT|STYLE|TEXTAREA|CANVAS|NOSCRIPT|SX-E)$/.test(n.nodeName) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT
    });
    const ts = [];
    let n;
    while (n = w.nextNode()) {
      if (n.nodeType === 3) ts.push(n); else if (n.hasAttribute("title") || n.hasAttribute("placeholder")) fixAttr(n);
    }
    const fl = ts.map(t => {
      const p = t.parentNode;
      return !!(p && p.nodeType === 1 && QUICK.test(t.nodeValue) && isFlex(p));
    });
    ts.forEach((t, i) => fixText(t, fl[i]));
  }
  E.fix = walk;
  {
    const tr0 = SX.trDom;
    SX.trDom = function(r) {
      if (tr0) tr0.apply(this, arguments);
      walk(r);
    };
  }
  new MutationObserver(ms => {
    for (const m of ms) {
      if (m.type === "characterData") fixText(m.target); else if (m.type === "attributes") fixAttr(m.target); else for (const n of m.addedNodes) walk(n);
    }
  }).observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ATTRS
  });
  walk(document.body);
  document.addEventListener("DOMContentLoaded", () => walk(document.body));
  const fontPx = f => {
    const m = /(\d+(?:\.\d+)?)px/.exec(f || "");
    return m ? +m[1] : 10;
  };
  const SIL = new Map;
  function sil(key, col) {
    const k = key + "|" + col;
    let c = SIL.get(k);
    if (c) return c;
    c = A.mk(16, 16);
    const x = c.getContext("2d");
    x.drawImage(E.icon(key), 0, 0);
    x.globalCompositeOperation = "source-in";
    x.fillStyle = col;
    x.fillRect(0, 0, 16, 16);
    if (SIL.size > 400) SIL.clear();
    SIL.set(k, c);
    return c;
  }
  const darkOf = fs => {
    if (typeof fs !== "string") return null;
    let r, g, b, m = /^#([0-9a-f]{6})$/i.exec(fs);
    if (m) {
      const v = parseInt(m[1], 16);
      r = v >> 16;
      g = v >> 8 & 255;
      b = v & 255;
    } else if (m = /^rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(fs)) {
      r = +m[1];
      g = +m[2];
      b = +m[3];
    } else return null;
    return .2126 * r + .7152 * g + .0722 * b < 40 ? fs : null;
  };
  function lay(ctx, oM, sp) {
    const fs = fontPx(ctx.font), S = 16 * Math.max(1, Math.round(fs / 20));
    let W = 0;
    const ws = [];
    for (let i = 0; i < sp.length; i += 3) {
      const w = sp[i] ? oM.call(ctx, sp[i]).width : 0;
      ws.push(w);
      W += w;
      if (i + 1 < sp.length) {
        ws.push(S);
        W += S;
      }
    }
    return {
      fs,
      S,
      W,
      ws
    };
  }
  function draw(ctx, oF, oM, t, x, y, fill) {
    const sp = split(t);
    if (!sp) return oF.call(ctx, t, x, y);
    const L = lay(ctx, oM, sp), al = ctx.textAlign, bl = ctx.textBaseline;
    let cx = al === "center" ? x - L.W / 2 : al === "right" || al === "end" ? x - L.W : x;
    const top = (bl === "top" || bl === "hanging" ? y : bl === "middle" ? y - L.fs / 2 : bl === "bottom" || bl === "ideographic" ? y - L.fs : y - L.fs * .8) + (L.fs - L.S) / 2;
    const dk = fill && darkOf(ctx.fillStyle), sm = ctx.imageSmoothingEnabled;
    ctx.textAlign = "left";
    try {
      for (let i = 0, j = 0; i < sp.length; i += 3) {
        if (sp[i]) oF.call(ctx, sp[i], cx, y);
        cx += L.ws[j++];
        if (i + 1 < sp.length) {
          if (fill) {
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(dk ? sil(sp[i + 1], dk) : E.icon(sp[i + 1]), Math.round(cx), Math.round(top), L.S, L.S);
          }
          cx += L.ws[j++];
        }
      }
    } finally {
      ctx.textAlign = al;
      ctx.imageSmoothingEnabled = sm;
    }
  }
  const tr = (ctx, t) => ctx.canvas && ctx.canvas._notr || !SX.tr ? t : SX.tr(t);
  for (const Ctx of [ window.CanvasRenderingContext2D, window.OffscreenCanvasRenderingContext2D ]) {
    if (!Ctx) continue;
    const pr = Ctx.prototype, oF = pr.fillText, oS = pr.strokeText, oM = pr.measureText;
    if (Ctx === window.CanvasRenderingContext2D) E.rawFill = oF;
    pr.fillText = function(t, x, y) {
      if (typeof t !== "string" || !QUICK.test(t)) return oF.apply(this, arguments);
      return draw(this, oF, oM, tr(this, t), x, y, true);
    };
    pr.strokeText = function(t, x, y) {
      if (typeof t !== "string" || !QUICK.test(t)) return oS.apply(this, arguments);
      return draw(this, oS, oM, tr(this, t), x, y, false);
    };
    pr.measureText = function(t) {
      if (typeof t !== "string" || !QUICK.test(t)) return oM.apply(this, arguments);
      const s = tr(this, t), sp = split(s);
      if (!sp) return oM.call(this, s);
      const L = lay(this, oM, sp), base = oM.call(this, sp.filter((q, i) => i % 3 === 0).join("") || " "), o = {
        width: L.W
      };
      for (const k of [ "actualBoundingBoxLeft", "actualBoundingBoxRight", "actualBoundingBoxAscent", "actualBoundingBoxDescent", "fontBoundingBoxAscent", "fontBoundingBoxDescent", "emHeightAscent", "emHeightDescent", "hangingBaseline", "alphabeticBaseline", "ideographicBaseline" ]) o[k] = base[k];
      o.actualBoundingBoxRight = Math.max(o.actualBoundingBoxRight || 0, L.W);
      return o;
    };
  }
  for (const k of [ "confirm", "alert", "prompt" ]) {
    const o = window[k];
    if (typeof o !== "function") continue;
    window[k] = function(msg) {
      const a = Array.prototype.slice.call(arguments);
      if (typeof msg === "string" && QUICK.test(msg)) a[0] = E.strip(SX.tr ? SX.tr(msg) : msg);
      return o.apply(window, a);
    };
  }
})(window.SX);
