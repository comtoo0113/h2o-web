"use strict";

window.SX = window.SX || {};

(function(SX) {
  let lang = "ko";
  if (lang !== "en") lang = "ko";
  SX.lang = lang;
  SX.setLang = function(l) {
    try {
      localStorage.setItem("sxd_lang", l === "en" ? "en" : "ko");
    } catch (e) {}
    const u = new URL(location.href);
    u.searchParams.delete("lang");
    location.href = u.toString();
  };
  SX.tr = s => s;
  SX.trDom = () => {};
  const langBtn = () => {
    const b = document.getElementById("btnLang");
    if (!b || b._lang) return;
    b._lang = 1;
    b.textContent = lang === "en" ? "한국어" : "English";
    b.onclick = () => SX.setLang(lang === "en" ? "ko" : "en");
  };
  langBtn();
  document.addEventListener("DOMContentLoaded", langBtn);
  const D = window.SX_LANG_EN;
  if (lang !== "en" || !D) return;
  document.documentElement.lang = "en";
  const KO = /[가-힣]/;
  const EX = new Map(Object.entries(D.exact || {}));
  const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const PATS = (D.pat || []).map(([ko, en]) => {
    const parts = ko.split(/\{(\d+)\}/), order = [];
    let re = "^", reG = "^", key = "";
    for (let i = 0; i < parts.length; i++) {
      if (i % 2 === 0) {
        re += escRe(parts[i]);
        reG += escRe(parts[i]);
        if (KO.test(parts[i]) && parts[i].length > key.length) key = parts[i];
      } else {
        re += "([\\s\\S]*?)";
        reG += "([\\s\\S]*)";
        order.push(+parts[i]);
      }
    }
    return {
      re: new RegExp(re + "$"),
      reG: new RegExp(reG + "$"),
      order,
      en,
      key
    };
  }).filter(p => KO.test(p.key));
  const NAMES = (D.names || []).filter(n => EX.has(n));
  const NAME_RE = NAMES.length ? new RegExp(NAMES.map(escRe).join("|"), "g") : null;
  const cache = new Map;
  let depth = 0;
  const UNIT = {
    "칸/초": " tiles/s",
    발: " rds",
    칸: " tiles",
    초: "s",
    분: " min",
    시간: "h",
    일: " days",
    개: "",
    명: "",
    번: "×",
    층: "F",
    점: " pts",
    원: " won"
  };
  const NUM_UNIT = new RegExp("(\\d[\\d,.]*)\\s?(" + Object.keys(UNIT).map(escRe).join("|") + ")(?![가-힣])", "g");
  const koN = s => {
    let n = 0;
    for (const ch of s) if (ch >= "가" && ch <= "힣") n++;
    return n;
  };
  const BR = /^([(\[「『<《"'])([\s\S]*)([)\]」』>》"'])$/;
  function core(s) {
    if (EX.has(s)) return EX.get(s);
    let best = s, bestK = koN(s);
    const take = out => {
      const k = koN(out);
      if (k < bestK) {
        best = out;
        bestK = k;
      }
      return bestK === 0;
    };
    if (depth < 4) {
      depth++;
      try {
        for (const p of PATS) {
          if (!s.includes(p.key)) continue;
          for (const re of [ p.re, p.reG ]) {
            const m = re.exec(s);
            if (!m) continue;
            const vals = {};
            p.order.forEach((idx, k) => {
              vals[idx] = m[k + 1];
            });
            if (take(p.en.replace(/\{(\d+)\}/g, (_, i) => {
              const v = vals[i];
              return v == null ? "" : tr(v);
            }))) return best;
          }
        }
        const b = BR.exec(s);
        if (b && take(b[1] + tr(b[2]) + b[3])) return best;
        if (/\s[·—|]\s|\s[·—]$|^[·—]\s/.test(s)) {
          const parts = s.split(/(\s*[·—|]\s*)/);
          if (take(parts.map((p, i) => i % 2 ? p : tr(p)).join(""))) return best;
        }
      } finally {
        depth--;
      }
    }
    if (NAME_RE) {
      for (const x of best === s ? [ s ] : [ s, best ]) {
        NAME_RE.lastIndex = 0;
        take(x.replace(NAME_RE, n => EX.get(n)));
      }
    }
    if (bestK) take(best.replace(NUM_UNIT, (m, n, u) => n + UNIT[u]));
    if (bestK) take(best.split(" ").map(w => {
      const m = /^([(\[「"']*)([\s\S]*?)([)\]」"',.:·]*)$/.exec(w);
      return m && EX.has(m[2]) ? m[1] + EX.get(m[2]) + m[3] : w;
    }).join(" "));
    return best;
  }
  function tr(s) {
    if (typeof s !== "string" || !KO.test(s)) return s;
    const c = cache.get(s);
    if (c !== undefined) return c;
    const lead = s.match(/^\s*/)[0], trail = s.slice(lead.length).match(/\s*$/)[0];
    const mid = s.slice(lead.length, s.length - trail.length).replace(/\s+/g, " ");
    let out = core(mid);
    if (out === mid && /\n/.test(s)) out = s.slice(lead.length, s.length - trail.length).split("\n").map(l => tr(l)).join("\n");
    out = lead + out + trail;
    if (cache.size > 2e4) cache.clear();
    cache.set(s, out);
    return out;
  }
  SX.tr = tr;
  const shownMiss = new Set;
  SX.trMissing = () => [ ...shownMiss ];
  const SKIP = new Set([ "SCRIPT", "STYLE", "TEXTAREA" ]);
  const ATTRS = [ "title", "placeholder", "aria-label", "data-alt" ];
  const BLOCK = /^(DIV|P|LI|UL|OL|TD|TH|TR|TABLE|H1|H2|H3|H4|H5|H6|BUTTON|LABEL|SECTION|HEADER|FOOTER|BODY|PRE)$/;
  function neighbor(n, dir) {
    let blk = n.parentElement;
    while (blk && !BLOCK.test(blk.tagName)) blk = blk.parentElement;
    if (!blk) return null;
    const w = document.createTreeWalker(blk, NodeFilter.SHOW_TEXT);
    w.currentNode = n;
    let m;
    while (m = dir < 0 ? w.previousNode() : w.nextNode()) if (m.nodeValue.length) return m.nodeValue;
    return null;
  }
  function spaced(n, t) {
    if (/^[A-Za-z(]/.test(t)) {
      const p = neighbor(n, -1);
      if (p && /[A-Za-z0-9)%]$/.test(p)) t = " " + t;
    }
    if (/[A-Za-z0-9)]$/.test(t)) {
      const q = neighbor(n, 1);
      if (q && /^[A-Za-z(]/.test(q)) t = t + " ";
    }
    return t;
  }
  function fixText(n) {
    const v = n.nodeValue;
    if (!v || !KO.test(v)) return;
    const p = n.parentNode;
    if (p && (SKIP.has(p.nodeName) || p.isContentEditable)) return;
    let t = tr(v);
    if (t !== v && !(p && p.closest && p.closest("[data-notr]"))) {
      t = spaced(n, t);
      n.nodeValue = t;
    }
  }
  function fixEl(el) {
    const de = el.getAttribute("data-en");
    if (de) {
      if (el.textContent !== de) el.textContent = de;
      return;
    }
    for (const a of ATTRS) {
      const v = el.getAttribute(a);
      if (v && KO.test(v)) {
        const t = tr(v);
        if (t !== v) el.setAttribute(a, t);
      }
    }
    if (el.nodeName === "INPUT" && (el.type === "button" || el.type === "submit") && KO.test(el.value)) el.value = tr(el.value);
  }
  function walk(root) {
    if (!root) return;
    if (root.nodeType === 3) return fixText(root);
    if (root.nodeType !== 1 || SKIP.has(root.nodeName)) return;
    fixEl(root);
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    let n;
    while (n = w.nextNode()) {
      if (n.nodeType === 3) fixText(n); else if (!SKIP.has(n.nodeName)) fixEl(n);
    }
  }
  new MutationObserver(ms => {
    for (const m of ms) {
      if (m.type === "characterData") fixText(m.target); else if (m.type === "attributes") fixEl(m.target); else for (const n of m.addedNodes) walk(n);
    }
  }).observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ATTRS
  });
  SX.trDom = walk;
  walk(document.head);
  walk(document.body);
  document.addEventListener("DOMContentLoaded", () => {
    walk(document.head);
    walk(document.body);
  });
  for (const Ctx of [ window.CanvasRenderingContext2D, window.OffscreenCanvasRenderingContext2D ]) {
    if (!Ctx) continue;
    for (const k of [ "fillText", "strokeText", "measureText" ]) {
      const o = Ctx.prototype[k];
      Ctx.prototype[k] = function(t) {
        if (typeof t === "string" && KO.test(t) && !(this.canvas && this.canvas._notr)) {
          const a = Array.prototype.slice.call(arguments);
          a[0] = tr(t);
          if (KO.test(a[0]) && shownMiss.size < 500) shownMiss.add(t);
          return o.apply(this, a);
        }
        return o.apply(this, arguments);
      };
    }
  }
  for (const k of [ "confirm", "alert", "prompt" ]) {
    const o = window[k];
    if (typeof o !== "function") continue;
    window[k] = function(msg) {
      const a = Array.prototype.slice.call(arguments);
      if (typeof msg === "string") a[0] = tr(msg);
      return o.apply(window, a);
    };
  }
})(window.SX);
