/* Family Storybooks: the customer's private proof page (proof.html?d=<draft>#<token>), linked from the order.
   After payment the cartoon service paints every page on its own (painting.js there) and emails the customer when
   they're ready. This page shows how far it has got, lets the customer have any page painted again, and approve the
   book. Checking is optional: a book that isn't approved goes to print on its own four days after the pages were ready. */
(function () {
  "use strict";
  var F = window.FST, esc = F.esc, root = document.getElementById("proof");
  var q = new URLSearchParams(location.search), id = q.get("d") || "", token = decodeURIComponent(location.hash.replace(/^#/, ""));
  var API = ((function () { try { return localStorage.getItem("fst-api"); } catch (e) { return ""; } })() || F.config.api || "").replace(/\/+$/, "");
  var st = null, key = null, S = null, imgs = {}, busy = {}, errs = {}, queue = [], active = 0, MAX = 2, msg = "", sure = false, waited = 0, polls = 0, open = {}, notes = {}, sent = {};

  function box(h, p) { root.innerHTML = '<section class="pf-box"><h1>' + esc(h) + "</h1><p>" + esc(p) + "</p></section>"; }
  if (!/^[a-z0-9]{20}$/.test(id) || !token) return box("This link isn't complete", "Please open the full link from your order email, or email " + F.config.email + " and we'll send it again.");

  function req(method, path, body) {
    var h = { Authorization: "Bearer " + token };
    if (body) h["Content-Type"] = "application/json";
    return fetch(API + "/api/drafts/" + id + path, { method: method, headers: h, body: body ? JSON.stringify(body) : undefined }).then(function (r) {
      var isJson = (r.headers.get("Content-Type") || "").indexOf("json") >= 0;
      if (!r.ok) return (isJson ? r.json() : Promise.resolve({})).then(function (j) { var e = new Error(j.error || "Something went wrong. Please try again."); e.status = r.status; throw e; });
      return isJson ? r.json() : r.blob();
    }, function () { var e = new Error("We couldn't reach our drawing service. Please check your connection."); e.status = 0; throw e; });
  }
  function image(slot) {
    return req("GET", "/cartoons/" + slot + "?w=web").then(function (b) { if (imgs[slot]) URL.revokeObjectURL(imgs[slot]); imgs[slot] = URL.createObjectURL(b); });
  }

  // ---------- names (the same rules as the website and the print file) ----------
  var names = {}, PRON = { she: { she: "she", her: "her" }, he: { she: "he", her: "his" } };
  function name(k) { var r = S.roles.filter(function (x) { return x.key === k; })[0]; return (names[k] || "").trim() || (r ? r.example : ""); }
  function fill(text, plain) {
    var pr = PRON[names.pron] || PRON.she;
    return esc(text).replace(/\{(\w+)\}/g, function (m, k, at, all) {
      if (pr[k]) return /(^|[.!?…]\s+|“)$/.test(all.slice(0, at)) ? pr[k].charAt(0).toUpperCase() + pr[k].slice(1) : pr[k];
      var n = esc(name(k)); return plain ? n : "<b>" + n + "</b>";
    });
  }
  function starring() { return S.roles.map(function (r) { return esc(name(r.key)); }).join(", ").replace(/, ([^,]*)$/, " and $1"); }

  // ---------- what needs painting ----------
  function has(slot) { return st.cartoons.indexOf(slot) >= 0; }
  function sharp(slot) { return (st.printReady || []).indexOf(slot) >= 0; }
  function charSlots() { return S.roles.map(function (r) { return "c-" + r.key; }).concat(S.villain ? ["c-villain"] : []); }
  function sceneSlots() { return S.pages.map(function (p, i) { return "s" + (i + 1); }); }
  function charsDone() { return charSlots().every(has); }
  function readyCount() { return sceneSlots().filter(sharp).length; }
  function allReady() { return readyCount() === S.pages.length && !active && !queue.length; }

  // Characters first (a part with no photo gets our stand-in, painted into this book), then every page at print size.
  // Our server paints the book; while it's working, look again every 30 seconds (for up to an hour) to show progress.
  function plan() {
    if (!st.paid || st.approved || (allReady() && st.paint && st.paint.readyAt) || polls > 120) return;
    polls++;
    setTimeout(function () { if (active || queue.length) return plan(); load().then(function () { paint(); plan(); }, plan); }, 30000);
    run();
  }
  function run() { while (active < MAX && queue.length) start(queue.shift()); }
  function start(s) {
    active++; busy[s] = true; errs[s] = ""; paint();
    attempt(s, 0).then(function () { busy[s] = false; active--; paint(); run(); });
  }
  function attempt(s, tries) {
    var body = { story: key };
    if (notes["redo-" + s]) body.note = notes["redo-" + s];
    if (/^c-/.test(s) && s !== "c-villain" && st.photos.indexOf(s) < 0) body.standin = true;
    return req("POST", "/cartoons/" + s, body).then(function (j) { st = j; return image(s); })
      .catch(function (e) {
        if (tries < 2 && (!e.status || e.status >= 500 || e.status === 409)) return new Promise(function (r) { setTimeout(r, 6000 * (tries + 1)); }).then(function () { return attempt(s, tries + 1); });
        errs[s] = e.message;
      });
  }

  // ---------- page ----------
  function scene(p, i) {
    var slot = "s" + (i + 1), pic;
    if (imgs[slot] && sharp(slot)) pic = '<img src="' + imgs[slot] + '" alt="' + fill(p.pic, true) + '">';
    else if (busy[slot]) pic = '<div class="pf-wait"><span class="pf-spin" aria-hidden="true"></span>Painting this page…</div>';
    else if (errs[slot]) pic = '<div class="pf-wait bad">' + esc(errs[slot]) + "</div>";
    else pic = '<div class="pf-wait">Waiting to be painted</div>';
    var ctl = "", form = "", reported = st.paint && (st.paint.issues || []).indexOf(slot) >= 0;
    if (!st.approved && st.paid) {
      if (errs[slot]) ctl = '<button type="button" class="btn ghost btn-sm" data-redo="' + slot + '">Try again</button>';
      else if (sharp(slot) && !busy[slot]) ctl = '<span class="pf-ctl"><button type="button" class="btn ghost btn-sm" data-open="redo-' + slot + '">Paint this page again</button>' +
        '<button type="button" class="pf-link" data-open="report-' + slot + '">Something wrong?</button></span>';
      if (open["redo-" + slot] && !busy[slot]) form = '<div class="pf-form"><label for="n-redo-' + slot + '">What should we change? <span class="muted">(optional)</span></label>' +
        '<textarea id="n-redo-' + slot + '" data-note="redo-' + slot + '" rows="2" maxlength="200" placeholder="For example: Grandma should be inside, looking out of the window">' + esc(notes["redo-" + slot] || "") + "</textarea>" +
        '<p class="small muted">We paint the page again from our example picture, with your note. The new picture replaces this one.</p>' +
        '<div class="pf-form-btns"><button type="button" class="btn red btn-sm" data-redo="' + slot + '">Paint it again</button><button type="button" class="pf-link" data-close="redo-' + slot + '">Cancel</button></div></div>';
      else if (open["report-" + slot]) form = '<div class="pf-form"><label for="n-report-' + slot + '">Tell our team what’s wrong with this page</label>' +
        '<textarea id="n-report-' + slot + '" data-note="report-' + slot + '" rows="3" maxlength="1000">' + esc(notes["report-" + slot] || "") + "</textarea>" +
        '<p class="small muted">We’ll fix it for you and email you. Your book won’t be printed until it’s fixed.</p>' +
        '<div class="pf-form-btns"><button type="button" class="btn red btn-sm" data-report="' + slot + '">Send to our team</button><button type="button" class="pf-link" data-close="report-' + slot + '">Cancel</button></div>' +
        (sent[slot] ? '<p class="pf-msg" role="status">' + esc(sent[slot]) + "</p>" : "") + "</div>";
      if (reported) form = '<p class="pf-note">Thanks for telling us. Our team is fixing this page, and your book won’t print until it’s done.</p>' + form;
    }
    return '<figure class="pf-spread"><div class="bv-page bv-spread side-' + p.side + '"><div class="bv-pic">' + pic + "</div>" +
      '<div class="bv-text">' + p.text.split("\n").map(function (l) { return "<p>" + fill(l) + "</p>"; }).join("") + "</div></div>" +
      "<figcaption><span>Pages " + (4 + i * 2) + " and " + (5 + i * 2) + "</span>" + ctl + "</figcaption>" + form + "</figure>";
  }
  function printOn() {
    var t = st.paint && st.paint.printOn;
    return t ? new Date(t).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }) : "";
  }
  function printOn() {
    var t = st.paint && st.paint.printOn;
    return t ? new Date(t).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }) : "";
  }
  function printLine() {
    var p = st.print || {}, s = p.status || "";
    var words = { QUEUED: "Approved. We're preparing your print files.", PDF_READY: "Your print files are ready and on their way to our printer.",
      CREATED: "With our printer.", UNPAID: "With our printer.", PAYMENT_IN_PROGRESS: "With our printer.", PRODUCTION_DELAYED: "With our printer, starting shortly.",
      PRODUCTION_READY: "With our printer, starting shortly.", IN_PRODUCTION: "Being printed.", SHIPPED: "Posted!", REJECTED: "Our printer had a problem with this book. We'll be in touch.", CANCELED: "This print run was cancelled. We'll be in touch." };
    var track = (p.tracking || []).map(function (u) { return /^https:\/\//.test(u) ? '<a href="' + esc(u) + '" rel="noopener" target="_blank">Track your parcel</a>' : ""; }).join(" ");
    return '<p class="pf-printing"><b>' + esc(words[s] || "Approved. Thank you!") + "</b> " + track + "</p>";
  }
  function paint() {
    var n = readyCount(), total = S.pages.length, ded = (names.dedication || "").trim();
    var head = '<header class="pf-head"><p class="eyebrow">Your storybook</p><h1>' + fill(S.title, true) + "</h1><p class=\"lede\">Starring " + starring() + "</p></header>";
    var status;
    if (!st.paid) status = '<div class="pf-bar"><p>We’re waiting for your payment to be confirmed. This page will carry on by itself in a moment.</p></div>';
    else if (st.approved) status = '<div class="pf-bar ok">' + printLine() + "</div>";
    else if (st.paint && st.paint.held) status = '<div class="pf-bar"><p><b>Thanks for telling us about a problem.</b> Our team is fixing it, and your book won’t be printed until it’s done. We’ll email you when it’s ready to look at again.</p></div>';
    else if (st.paint && st.paint.stuck && n < total) status = '<div class="pf-bar"><p><b>We’ve hit a snag painting your book.</b> Our team has been told and is on it. We’ll email you as soon as your pages are ready, so you don’t need to keep this page open.</p></div>';
    else if (n < total) status = '<div class="pf-bar"><p><span class="pf-spin" aria-hidden="true"></span> ' + (charsDone() ? "We’re painting your book: <b>" + n + " of " + total + "</b> pages ready." : "We’re getting your characters ready for every page.") +
      " This can take up to an hour. <b>You don’t need to keep this page open:</b> we’ll email you when every page is ready.</p>" +
      '<div class="pf-meter"><i style="width:' + Math.round(100 * n / total) + '%"></i></div></div>';
    else status = '<div class="pf-bar ok"><p><b>Every page is ready.</b> Checking them is optional. Have a look, ask for any page to be painted again, and press Approve to print straight away.' +
      (printOn() ? " If you don’t, we’ll print your book as it is on <b>" + esc(printOn()) + "</b>, so it isn’t delayed." : "") + "</p></div>";
    var cast = '<section class="pf-cast"><h2>Meet the characters</h2><div class="bv-cast">' + charSlots().map(function (s) {
      var k = s.slice(2), r = S.roles.filter(function (x) { return x.key === k; })[0];
      var src = imgs[s] || (S.art + (k === "villain" ? "villain" : k) + ".webp");
      return '<figure class="drawn"><img src="' + src + '" alt="">' + "<figcaption>" + (r ? esc(name(k)) + "<span>as " + esc(r.name) + "</span>" : esc(S.villain.name) + "<span>our own character</span>") + "</figcaption></figure>";
    }).join("") + "</div>" +
      '<p class="pf-ded"><span class="muted">Dedication:</span> ' + (ded ? esc(ded).replace(/\n/g, "<br>") : fill(S.dedication, true)) + "</p>" +
      '<p class="small muted">A name or the dedication needs changing? Email ' + esc(F.config.email) + (printOn() ? " before " + esc(printOn()) : " before you approve") + ", and we'll fix it.</p></section>";
    var pages = '<section class="pf-pages">' + S.pages.map(scene).join("") + "</section>";
    var approve = "";
    if (st.paid && !st.approved) approve = '<section class="pf-approve"><h2>Happy with it? Approve your book</h2>' +
      '<label class="check"><input type="checkbox" id="pf-sure"' + (sure ? " checked" : "") + (allReady() ? "" : " disabled") + "><span>I've looked at the pages, the names and the dedication. Please print my book.</span></label>" +
      '<button type="button" class="btn red pf-ok"' + (allReady() && sure ? "" : " disabled") + ">Approve and print</button>" +
      '<p class="pf-msg" role="status" aria-live="polite">' + esc(msg || (allReady() ? "This step is optional." + (printOn() ? " If you don’t approve, we’ll print your book as it is on " + printOn() + "." : "") : "You can approve once every page is ready.")) + "</p></section>";
    root.innerHTML = head + status + cast + pages + approve;
  }

  root.addEventListener("click", function (e) {
    var b = e.target.closest("[data-redo]");
    if (b) { var s = b.getAttribute("data-redo"); delete errs[s]; delete open["redo-" + s]; queue.push(s); msg = ""; run(); return; }
    var o = e.target.closest("[data-open]");
    if (o) { var k = o.getAttribute("data-open"); open = {}; open[k] = true; paint(); var t = document.getElementById("n-" + k); if (t) t.focus(); return; }
    var c = e.target.closest("[data-close]");
    if (c) { delete open[c.getAttribute("data-close")]; paint(); return; }
    var rp = e.target.closest("[data-report]");
    if (rp) {
      var slot = rp.getAttribute("data-report"), text = (notes["report-" + slot] || "").trim();
      if (text.length < 3) { sent[slot] = "Please tell us what’s wrong first."; paint(); return; }
      sent[slot] = "Sending…"; paint();
      req("POST", "/issues", { slot: slot, note: text }).then(function (j) { st = j; delete sent[slot]; delete open["report-" + slot]; delete notes["report-" + slot]; paint(); },
        function (e2) { sent[slot] = e2.message; paint(); });
      return;
    }
    if (e.target.closest(".pf-ok")) {
      if (!allReady() || !sure) return;
      msg = "Sending your book to print…"; paint();
      req("PATCH", "", { approve: true }).then(function (j) { st = j; msg = ""; paint(); window.scrollTo({ top: 0, behavior: "smooth" }); },
        function (e2) { msg = e2.message; paint(); });
    }
  });
  root.addEventListener("input", function (e) { var k = e.target.getAttribute && e.target.getAttribute("data-note"); if (k) notes[k] = e.target.value; });
  root.addEventListener("change", function (e) { if (e.target.id === "pf-sure") { sure = e.target.checked; paint(); } });

  function load() {
    return req("GET", "").then(function (j) {
      st = j; key = (j.cover && j.cover.story) || String(j.book || "").replace(/^fst-/, ""); S = F.stories[key];
      if (!S) throw new Error("We couldn't find this story.");
      names = (j.cover && j.cover.names) || {};
      var want = charSlots().filter(has).concat(sceneSlots().filter(sharp)).filter(function (s) { return !imgs[s]; });
      return Promise.all(want.map(function (s) { return image(s).catch(function () {}); }));
    });
  }
  // Payment can reach us a little after the customer returns from checkout: look again for a few minutes.
  function waitForPayment() {
    if (st.paid || waited > 20) return;
    waited++;
    setTimeout(function () { load().then(function () { paint(); if (st.paid) plan(); else waitForPayment(); }, waitForPayment); }, 15000);
  }
  root.setAttribute("aria-busy", "true");
  load().then(function () {
    root.removeAttribute("aria-busy"); document.title = "Your proof: " + S.name + " | Family Storybooks";
    paint(); if (st.paid) plan(); else waitForPayment();
  }, function (e) {
    if (e.status === 404 || e.status === 403) box("We can't find this book", "The link may be incomplete, or the book has been deleted. Please email " + F.config.email + " and we'll help.");
    else box("Something went wrong", e.message);
  });
})();
