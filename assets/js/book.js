/* Family Storybooks: the "Look inside" flip-through and the family's names.
   The words come from FST.stories[story].pages. Pictures are placeholders, apart from the
   "Meet the characters" page, which shows the family's own characters once they are drawn (maker.js). */
(function () {
  "use strict";
  var F = window.FST, esc = F.esc;
  var root = document.querySelector("[data-book]");
  if (!root) return;
  var key = root.getAttribute("data-book"), S = F.stories[key];
  var roles = S.roles;

  // ---------- shared cast: names (kept in this browser) and drawn characters ----------
  var NKEY = "fst-names-" + key, listeners = [];
  var cast = F.cast = { story: key, names: {}, toons: {}, on: function (fn) { listeners.push(fn); } };
  try { cast.names = JSON.parse(localStorage.getItem(NKEY) || "{}") || {}; } catch (e) { cast.names = {}; }
  cast.changed = function () { listeners.forEach(function (fn) { fn(); }); };
  cast.name = function (k) {
    var r = roles.filter(function (x) { return x.key === k; })[0];
    var n = (cast.names[k] || "").trim();
    return n || (r ? r.example : "");
  };
  // Fill {hero}, {mum}... with names. Returns safe HTML; names are shown in bold.
  cast.fill = function (text, plain) {
    return esc(text).replace(/\{(\w+)\}/g, function (m, k) { var n = esc(cast.name(k)); return plain ? n : "<b>" + n + "</b>"; });
  };

  function syncInputs() {
    document.querySelectorAll("[data-name]").forEach(function (inp) {
      if (document.activeElement !== inp) inp.value = cast.names[inp.getAttribute("data-name")] || "";
    });
  }
  document.addEventListener("input", function (e) {
    var k = e.target.getAttribute && e.target.getAttribute("data-name");
    if (!k) return;
    cast.names[k] = e.target.value.slice(0, 24);
    try { localStorage.setItem(NKEY, JSON.stringify(cast.names)); } catch (err) {}
    syncInputs(); cast.changed();
  });
  syncInputs();

  // ---------- pages ----------
  function tpl(id) { var t = document.getElementById(id); return t ? t.innerHTML : ""; }
  var pages = [{ kind: "cover" }, { kind: "dedication" }, { kind: "meet" }].concat(S.pages.map(function (p, i) { return { kind: "spread", n: i + 1, p: p }; }));

  function castFigure(r, i) {
    var img = cast.toons[r.key];
    var art = img ? '<img src="' + img + '" alt="' + esc(cast.name(r.key)) + ' drawn as ' + esc(r.name) + '">' : tpl("cast-" + i);
    return '<figure class="' + (img ? "drawn" : "") + '">' + art + "<figcaption>" + esc(cast.name(r.key)) + "<span>as " + esc(r.name) + "</span></figcaption></figure>";
  }

  function render(i) {
    var pg = pages[i], html;
    if (pg.kind === "cover") {
      html = '<div class="bv-page bv-cover"><div class="bv-cover-art">' + (F.motifs[key] || "") + "</div>" +
        '<p class="bv-kicker">A Family Storybook</p><h3>' + cast.fill(S.title, true) + "</h3>" +
        '<p class="bv-sub">Starring ' + roles.map(function (r) { return esc(cast.name(r.key)); }).join(", ").replace(/, ([^,]*)$/, " and $1") + "</p></div>";
    } else if (pg.kind === "dedication") {
      html = '<div class="bv-page bv-plain"><p class="bv-ded">' + cast.fill(S.dedication, true) + '</p><p class="bv-note">Your own message goes here.</p></div>';
    } else if (pg.kind === "meet") {
      var anyDrawn = roles.some(function (r) { return cast.toons[r.key]; });
      html = '<div class="bv-page bv-meet"><h3>Meet the characters</h3><div class="bv-cast">' + roles.map(castFigure).join("") +
        '<figure class="villain">' + tpl("wolf-art") + "<figcaption>The Wolf<span>our own character</span></figcaption></figure></div>" +
        (anyDrawn ? "" : '<p class="bv-note">These are stand-ins. <a href="#characters">Add your photos</a> to see your own family here.</p>') + "</div>";
    } else {
      var p = pg.p;
      html = '<div class="bv-page bv-spread side-' + p.side + '"><div class="bv-pic">' + tpl("scene-" + p.scene) + (p.wolf ? '<div class="bv-wolf">' + tpl("wolf-art") + "</div>" : "") +
        '<p class="bv-cap"><span>Picture:</span> ' + cast.fill(p.pic, true) + "</p></div>" +
        '<div class="bv-text">' + p.text.split("\n").map(function (line) { return "<p>" + cast.fill(line) + "</p>"; }).join("") + "</div></div>";
    }
    return html;
  }

  var stage = root.querySelector(".bv-stage"), count = root.querySelector(".bv-count");
  var prev = root.querySelector(".bv-prev"), next = root.querySelector(".bv-next"), dots = root.querySelector(".bv-dots");
  var at = 0;
  function label(i) { var pg = pages[i]; return pg.kind === "cover" ? "Cover" : pg.kind === "dedication" ? "Dedication" : pg.kind === "meet" ? "Meet the characters" : "Spread " + pg.n; }
  dots.innerHTML = pages.map(function (p, i) { return '<button type="button" data-go="' + i + '" aria-label="' + label(i) + '"></button>'; }).join("");
  function show(i, dir) {
    at = Math.max(0, Math.min(pages.length - 1, i));
    stage.innerHTML = render(at);
    stage.className = "bv-stage" + (dir ? " turn-" + dir : "");
    count.textContent = label(at) + " · " + (at + 1) + " of " + pages.length;
    prev.disabled = at === 0; next.disabled = at === pages.length - 1;
    dots.querySelectorAll("button").forEach(function (b, j) { b.setAttribute("aria-current", j === at ? "true" : "false"); });
  }
  prev.addEventListener("click", function () { show(at - 1, "back"); });
  next.addEventListener("click", function () { show(at + 1, "fwd"); });
  dots.addEventListener("click", function (e) { var b = e.target.closest("[data-go]"); if (b) show(+b.getAttribute("data-go"), +b.getAttribute("data-go") > at ? "fwd" : "back"); });
  root.addEventListener("keydown", function (e) {
    if (e.target.matches("input,select,textarea")) return;
    if (e.key === "ArrowRight") { show(at + 1, "fwd"); e.preventDefault(); }
    if (e.key === "ArrowLeft") { show(at - 1, "back"); e.preventDefault(); }
  });
  // Swipe on phones.
  var x0 = null;
  stage.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  stage.addEventListener("touchend", function (e) {
    if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(dx) > 50) show(at + (dx < 0 ? 1 : -1), dx < 0 ? "fwd" : "back");
  });
  cast.show = function (kind) { for (var i = 0; i < pages.length; i++) if (pages[i].kind === kind) return show(i); };
  cast.on(function () { show(at); });
  show(0);
})();
