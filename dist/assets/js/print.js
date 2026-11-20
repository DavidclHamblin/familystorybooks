/* Family Storybooks: builds a book's print files for Lulu in the browser (print.html).
   print.html?story=redhood                      our example book (stand-ins and example art), for checking the layout
   print.html?story=redhood&d=<draft>#<token>    a customer's book, from the cartoon service
   &part=cover                                   the cover sheet instead of the 28 inside pages
   Save as PDF from Chrome (or headless Chrome): page sizes come from print.css. When everything has loaded,
   <body data-ready="1">; if something is missing, <body data-error="..."> and the page says what. */
(function () {
  "use strict";
  var F = window.FST, q = new URLSearchParams(location.search);
  var key = q.get("story") || "redhood", S = F.stories[key], part = q.get("part") === "cover" ? "cover" : "interior";
  var draft = q.get("d"), token = decodeURIComponent((location.hash || "").slice(1));
  var root = document.getElementById("book"), status = document.getElementById("status");
  var COLOURS = { red: "#EE4B2B", orange: "#FF8A1F", sun: "#E0A200", leaf: "#1FB45A", sky: "#16A6E3", grape: "#8A3FD9", pink: "#F2558C", brown: "#9A5B34" };
  var LOGO = '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 8C12 5 6 5 2 6V16C6 15 12 15 16 17.2Z" fill="#EE4B2B"/><path d="M16 8C20 5 26 5 30 6V16C26 15 20 15 16 17.2Z" fill="#FFC21A"/><path d="M2 17.4C6 16.4 12 16.4 16 18.6V28C12 25 6 25 2 26Z" fill="#16A6E3"/><path d="M30 17.4C26 16.4 20 16.4 16 18.6V28C20 25 26 25 30 26Z" fill="#1FB45A"/><path d="M16 8v20" stroke="#1E1A33" stroke-width="1.5"/></svg>';
  function fail(msg) { document.body.setAttribute("data-error", msg); status.textContent = "Can't build this book: " + msg; }
  if (!S || !S.ready) return fail("unknown story " + key);
  var esc = F.esc;

  // ---------- names: the family's own (saved on the draft at checkout) or our examples ----------
  var names = {};
  function name(k) { var r = S.roles.filter(function (x) { return x.key === k; })[0]; return (names[k] || "").trim() || (r ? r.example : ""); }
  var PRON = { she: { she: "she", her: "her" }, he: { she: "he", her: "his" } };
  function fill(text, plain) {   // the same rules as the website's Look inside (book.js)
    var pr = PRON[names.pron] || PRON.she;
    return esc(text).replace(/\{(\w+)\}/g, function (m, k, at, all) {
      if (pr[k]) return /(^|[.!?…]\s+|“)$/.test(all.slice(0, at)) ? pr[k].charAt(0).toUpperCase() + pr[k].slice(1) : pr[k];
      var n = esc(name(k)); return plain ? n : "<b>" + n + "</b>";
    });
  }
  function starring() { return S.roles.map(function (r) { return esc(name(r.key)); }).join(", ").replace(/, ([^,]*)$/, " and $1"); }

  // ---------- pictures ----------
  var pics = {};   // slot -> URL
  function api(path) { return fetch(F.config.api + "/api/drafts/" + encodeURIComponent(draft) + path, { headers: { Authorization: "Bearer " + token } }); }
  function load() {
    if (!draft) {   // our example book
      S.roles.forEach(function (r) { pics["c-" + r.key] = S.art + r.key + ".webp"; });
      pics["c-villain"] = S.art + "villain.webp";
      S.pages.forEach(function (p, i) { pics["s" + (i + 1)] = S.art + "s" + (i + 1) + ".webp"; });
      return Promise.resolve();
    }
    return api("").then(function (r) { if (!r.ok) throw new Error("draft not found (" + r.status + ")"); return r.json(); }).then(function (st) {
      var c = st.cover || {};
      if (c.story && c.story !== key) throw new Error("this draft is for " + c.story);
      names = c.names || {};
      var want = ["c-villain"].concat(S.roles.map(function (r) { return "c-" + r.key; }), S.pages.map(function (p, i) { return "s" + (i + 1); }));
      var missing = want.filter(function (s) { return st.cartoons.indexOf(s) < 0 && !/^c-/.test(s); });
      if (missing.length) throw new Error("pictures not drawn yet: " + missing.join(", "));
      var soft = S.pages.map(function (p, i) { return "s" + (i + 1); }).filter(function (s) { return (st.printReady || []).indexOf(s) < 0; });
      if (soft.length && q.get("allowSoft") !== "1") throw new Error("pictures not at print size yet: " + soft.join(", "));
      return Promise.all(want.map(function (slot) {
        if (st.cartoons.indexOf(slot) < 0) { pics[slot] = S.art + slot.slice(2) + ".webp"; return null; }   // a part with no photo uses our stand-in
        return api("/cartoons/" + slot).then(function (r) { if (!r.ok) throw new Error("couldn't load " + slot); return r.blob(); })
          .then(function (b) { pics[slot] = URL.createObjectURL(b); });
      }));
    });
  }

  // ---------- pages ----------
  function pg(side, cls, inner) { return '<section class="pg ' + side + " " + cls + '">' + inner + "</section>"; }
  function img(slot, cls, alt) { return '<img class="' + cls + '" src="' + pics[slot] + '" alt="' + esc(alt || "") + '">'; }
  function interior() {
    var out = [];
    // 1 (right): title page
    out.push(pg("r", "title-page", '<div class="safe"><p class="kicker">A Family Storybook</p>' + img("c-hero", "title-art", name("hero")) +
      '<h1 class="title">' + fill(S.title, true) + '</h1><p class="starring">Starring ' + starring() + "</p></div>"));
    // 2 (left): dedication
    var ded = (names.dedication || "").trim();
    out.push(pg("l", "ded-page", '<div class="safe"><p class="ded">' + (ded ? esc(ded).replace(/\n/g, "<br>") : fill(S.dedication, true)) + "</p></div>"));
    // 3 (right): Meet the characters
    var figs = S.roles.map(function (r) {
      return "<figure>" + img("c-" + r.key, "", name(r.key)) + "<figcaption>" + esc(name(r.key)) + "<span>as " + esc(r.name) + "</span></figcaption></figure>";
    }).join("") + "<figure>" + img("c-villain", "", S.villain.name) + "<figcaption>" + esc(S.villain.name) + "<span>our own " +
      (/ and |^The Three/.test(S.villain.name) ? "characters" : "character") + "</span></figcaption></figure>";
    out.push(pg("r", "meet-page", '<div class="safe"><h2>Meet the characters</h2><div class="cast">' + figs + "</div></div>"));
    // 4–27: twelve spreads, each a left and a right page cut from one picture
    S.pages.forEach(function (p, i) {
      var slot = "s" + (i + 1), words = '<div class="words">' + p.text.split("\n").map(function (l) { return "<p>" + fill(l) + "</p>"; }).join("") + "</div>";
      out.push(pg("l", "spread", img(slot, "spread-pic", fill(p.pic, true)) + (p.side === "left" ? words : "")));
      out.push(pg("r", "spread", img(slot, "spread-pic", "") + (p.side === "right" ? words : "")));
    });
    // 28 (left): the end
    out.push(pg("l", "end-page", '<div class="safe"><p class="the-end">The End</p><p class="made-for">Made especially for ' + esc(name("hero")) +
      '.</p><span class="brand">' + LOGO + "Family Storybooks</span></div>"));
    return out.join("");
  }
  function cover() {
    // Lulu's sheet for this book: 482.6 × 260.35mm. Wrap + bleed W on each edge; the spine is what is left.
    var W = (260.35 - 216) / 2, spine = 482.6 - 2 * 216 - 2 * W;
    return '<section class="cover" style="--cover:' + (COLOURS[S.color] || COLOURS.red) + ";--w:" + W.toFixed(3) + "mm;--s:" + spine.toFixed(3) + 'mm">' +
      '<div class="cv-back"><div class="cv-safe"><p class="cv-blurb">' + esc(S.blurb) + '</p><div class="cv-brand"><span class="brand">' + LOGO +
      'Family Storybooks</span><span class="cv-url">familystorybooks.co.uk</span></div></div></div><div class="cv-spine"></div>' +
      '<div class="cv-front"><div class="cv-safe"><p class="cv-kicker">A Family Storybook</p><h1 class="cv-title">' + fill(S.title, true) +
      '</h1><div class="cv-art">' + img("c-hero", "", name("hero")) + '</div><p class="cv-star">Starring ' + starring() + "</p></div></div></section>";
  }

  load().then(function () {
    root.innerHTML = part === "cover" ? cover() : interior();
    var imgs = [].slice.call(root.querySelectorAll("img"));
    // Long passages shrink a little (24pt down to 17pt) so the words always fit their panel.
    return document.fonts.ready.then(function () {
      [].forEach.call(root.querySelectorAll(".words"), function (w) {
        for (var pt = 24; pt > 17 && w.scrollHeight > w.clientHeight; pt -= 0.5) w.style.setProperty("--fs", pt + "pt");
      });
      return imgs;
    });
  }).then(function (imgs) {
    return Promise.all([document.fonts.ready].concat(imgs.map(function (i) {
      return i.complete ? (i.naturalWidth ? null : Promise.reject(new Error("a picture didn't load"))) :
        new Promise(function (ok, no) { i.onload = ok; i.onerror = function () { no(new Error("a picture didn't load")); }; });
    })));
  }).then(function () {
    var n = root.querySelectorAll(".pg").length;
    status.textContent = part === "cover" ? "Cover ready: print to PDF (482.6 × 260.35 mm)." : "Ready: " + n + " pages. Print to PDF (8.75 × 8.75 in, no margins).";
    document.body.setAttribute("data-ready", "1");
  }).catch(function (e) { fail(e.message); });
})();
