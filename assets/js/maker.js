/* Family Storybooks: "Meet your characters". The family adds a photo for each part, and our shared
   photo and cartoon service draws each person as a story character. Only the characters page is
   drawn before ordering; the rest of the book is drawn after ordering, from the approved characters.
   Photos are shrunk and stripped of hidden data (such as location) in the browser before upload, kept
   in private storage, and never shown anywhere except back to this browser. */
(function () {
  "use strict";
  var F = window.FST, esc = F.esc;
  var root = document.querySelector("[data-maker]");
  if (!root || !F.cast) return;
  var cast = F.cast, key = cast.story, S = F.stories[key], roles = S.roles;
  var API = (testApi() || F.config.api || "").replace(/\/+$/, "");
  function testApi() { try { return localStorage.getItem("fst-api"); } catch (e) { return ""; } }
  var DKEY = "fst-toon-" + key, BOOK = "fst-" + key;
  var files = {}, where = {}, busy = {}, errors = {};
  var msg = root.querySelector(".mk-msg"), left = root.querySelector(".mk-left");

  // ---------- talking to the service ----------
  function saved() { try { var d = JSON.parse(localStorage.getItem(DKEY) || "null"); return d && d.id && d.token ? d : null; } catch (e) { return null; } }
  function forget() { try { localStorage.removeItem(DKEY); } catch (e) {} }
  function req(method, path, d, body, type) {
    var h = {};
    if (d) h.Authorization = "Bearer " + d.token;
    if (body instanceof Blob) h["Content-Type"] = type || body.type;
    else if (body !== undefined) { h["Content-Type"] = "application/json"; body = JSON.stringify(body); }
    return fetch(API + path, { method: method, headers: h, body: body }).then(function (r) {
      var isJson = (r.headers.get("Content-Type") || "").indexOf("json") >= 0;
      if (!r.ok) return (isJson ? r.json() : Promise.resolve({})).then(function (j) { var e = new Error(j.error || "Something went wrong. Please try again."); e.status = r.status; throw e; });
      return isJson ? r.json() : r.blob();
    }, function () { var e = new Error("We couldn't reach our drawing service. Please check your connection and try again."); e.status = 0; throw e; });
  }
  var creating = null;
  function draft(consent) {
    var d = saved();
    if (d) return Promise.resolve(d);
    if (!creating) creating = req("POST", "/api/drafts", null, { book: BOOK, style: "storybook", consent: !!consent }).then(function (j) {
      var nd = { id: j.id, token: j.token };
      try { localStorage.setItem(DKEY, JSON.stringify(nd)); } catch (e) {}
      creating = null; return nd;
    }, function (e) { creating = null; throw e; });
    return creating;
  }
  // Shrink to at most 1600px and re-encode as JPEG: smaller uploads, no EXIF or location data.
  function prepare(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () {
        var s = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight)), c = document.createElement("canvas");
        c.width = Math.round(img.naturalWidth * s); c.height = Math.round(img.naturalHeight * s);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob(function (b) { b ? resolve(b) : reject(new Error("We couldn't read that photo.")); }, "image/jpeg", 0.9);
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("We couldn't read that photo. Please try a JPG or PNG.")); };
      img.src = url;
    });
  }
  function slot(k) { return "c-" + k; }
  function fetchToon(d, k) {
    return req("GET", "/api/drafts/" + d.id + "/cartoons/" + slot(k), d).then(function (b) {
      if (cast.toons[k]) URL.revokeObjectURL(cast.toons[k]);
      cast.toons[k] = URL.createObjectURL(b);
    });
  }

  // ---------- drawing ----------
  var status = null;
  function showLeft() {
    if (!status || status.paid) { left.textContent = ""; return; }
    left.textContent = "Free tries left: " + status.redosLeft + ".";
  }
  function draw(k, d, upload) {
    busy[k] = true; delete errors[k]; paint();
    var step = upload ? prepare(files[k]).then(function (b) { return req("PUT", "/api/drafts/" + d.id + "/photos/" + slot(k), d, b, "image/jpeg"); }) : Promise.resolve();
    return step.then(function () {
      return req("POST", "/api/drafts/" + d.id + "/cartoons/" + slot(k), d, { story: key, where: where[k] || "" });
    }).then(function (j) {
      status = j; if (upload) delete files[k];
      return fetchToon(d, k);
    }).then(function () { busy[k] = false; }, function (e) {
      busy[k] = false; errors[k] = e.message;
      if (e.status === 402 || e.status === 429) { msg.textContent = e.message; }
      if (e.status === 403 || e.status === 404) { if (e.message === "Not found" || e.message === "Not allowed") { forget(); } }
    }).then(function () { paint(); showLeft(); cast.changed(); });
  }
  function drawAll() {
    msg.textContent = "";
    var want = roles.filter(function (r) { return files[r.key]; });
    var hero = roles.filter(function (r) { return r.required; })[0];
    if (!want.length) { msg.textContent = "Add at least one photo first."; return; }
    if (hero && !files[hero.key] && !cast.toons[hero.key]) { msg.textContent = "Please add a photo of " + (cast.names[hero.key] || "your child") + " for " + hero.name + "."; return; }
    if (!root.querySelector("#mk-consent").checked) { msg.textContent = "Please tick the box to confirm you may use these photos."; root.querySelector("#mk-consent").focus(); return; }
    if (!API) { msg.textContent = "Drawing isn't switched on yet. Please try again soon."; return; }
    var btn = root.querySelector(".mk-go"); btn.disabled = true;
    msg.textContent = "Drawing your characters. This takes about 20 to 40 seconds each…";
    draft(true).then(function (d) {
      // Two at a time, so a family of four is ready in about a minute.
      var queue = want.slice(), running = [];
      function nextOne() { var r = queue.shift(); return r ? draw(r.key, d, true).then(nextOne) : Promise.resolve(); }
      running.push(nextOne(), nextOne());
      return Promise.all(running);
    }).then(function () {
      btn.disabled = false;
      var failed = roles.filter(function (r) { return errors[r.key]; });
      if (!failed.length) { msg.textContent = "Here they are! Have a look at your characters page in the book above."; cast.show("meet"); }
      else if (!/free/i.test(msg.textContent)) msg.textContent = "Some characters couldn't be drawn. You can try those again, or use a different photo.";
    }, function (e) { btn.disabled = false; msg.textContent = e.message; });
  }

  // ---------- the cards ----------
  var cards = root.querySelector(".mk-cards");
  var WHERE = [["", "They're the only person in it"], ["on the left", "The person on the left"], ["in the middle", "The person in the middle"], ["on the right", "The person on the right"], ["at the front", "The person at the front"], ["at the back", "The person at the back"]];
  cards.innerHTML = roles.map(function (r) {
    return '<div class="mk-card" data-role="' + r.key + '">' +
      '<div class="mk-pic"></div>' +
      '<div class="mk-body"><p class="who">' + esc(r.who) + '</p><h3>' + esc(r.name) + (r.required ? "" : ' <span class="hint">(optional)</span>') + "</h3>" +
      '<label class="field"><span>' + esc(r.label) + '</span><input type="text" data-name="' + r.key + '" maxlength="24" placeholder="e.g. ' + esc(r.example) + '"></label>' +
      '<label class="mk-file btn ghost btn-sm"><input type="file" accept="image/jpeg,image/png,image/webp" data-file="' + r.key + '"><span>Choose a photo</span></label>' +
      '<label class="field mk-where" hidden><span>Who is it in the photo?</span><select data-where="' + r.key + '">' + WHERE.map(function (w) { return '<option value="' + w[0] + '">' + w[1] + "</option>"; }).join("") + "</select></label>" +
      '<p class="mk-state" role="status"></p><button type="button" class="btn ghost btn-sm mk-redo" data-redo="' + r.key + '" hidden>Draw again</button></div></div>';
  }).join("");
  // The names fields were just created: fill them in.
  cards.querySelectorAll("[data-name]").forEach(function (i) { i.value = cast.names[i.getAttribute("data-name")] || ""; });

  var previews = {};
  function paint() {
    roles.forEach(function (r) {
      var k = r.key, card = cards.querySelector('[data-role="' + k + '"]'), pic = card.querySelector(".mk-pic"), st = card.querySelector(".mk-state");
      var src = cast.toons[k] || previews[k];
      pic.innerHTML = src ? '<img src="' + src + '" alt="">'
        : S.art ? '<img src="' + S.art + k + '.webp" alt=""><span class="mk-tag">Our stand-in</span>' : '<span class="mk-empty">No photo yet</span>';
      pic.className = "mk-pic" + (cast.toons[k] ? " drawn" : previews[k] ? " photo" : S.art ? " drawn standin" : "") + (busy[k] ? " busy" : "");
      card.querySelector(".mk-where").hidden = !files[k];
      card.querySelector(".mk-redo").hidden = !cast.toons[k] || busy[k] || !!files[k];
      card.querySelector(".mk-file span").textContent = cast.toons[k] || files[k] ? "Use a different photo" : "Choose a photo";
      st.textContent = busy[k] ? "Drawing " + cast.name(k) + "…" : errors[k] ? errors[k] : files[k] ? "Ready to draw." : cast.toons[k] ? "Drawn as " + r.name + "." : "";
      st.className = "mk-state" + (errors[k] ? " bad" : "");
    });
  }
  cards.addEventListener("change", function (e) {
    var k = e.target.getAttribute("data-file");
    if (k && e.target.files[0]) {
      var f = e.target.files[0];
      if (!/^image\//.test(f.type)) { errors[k] = "Please choose a photo (JPG, PNG or WebP)."; paint(); return; }
      files[k] = f; delete errors[k];
      if (previews[k]) URL.revokeObjectURL(previews[k]);
      previews[k] = URL.createObjectURL(f);  // shown only here, in this browser
      if (cast.toons[k]) { URL.revokeObjectURL(cast.toons[k]); delete cast.toons[k]; cast.changed(); }
      paint();
    }
    var w = e.target.getAttribute("data-where");
    if (w) where[w] = e.target.value;
  });
  cards.addEventListener("click", function (e) {
    var b = e.target.closest("[data-redo]"); if (!b) return;
    var d = saved(); if (!d) return;
    msg.textContent = "";
    draw(b.getAttribute("data-redo"), d, false);
  });
  root.querySelector(".mk-go").addEventListener("click", drawAll);
  root.querySelector(".mk-delete").addEventListener("click", function () {
    var d = saved();
    var done = function () {
      forget(); status = null;
      roles.forEach(function (r) { if (cast.toons[r.key]) URL.revokeObjectURL(cast.toons[r.key]); if (previews[r.key]) URL.revokeObjectURL(previews[r.key]); });
      cast.toons = {}; previews = {}; files = {}; errors = {};
      cards.querySelectorAll("input[type=file]").forEach(function (i) { i.value = ""; });
      paint(); showLeft(); cast.changed(); msg.textContent = "Deleted. Your photos and characters have been removed from our service.";
    };
    if (!d) return done();
    req("DELETE", "/api/drafts/" + d.id, d).then(done, function (e) { if (e.status === 404 || e.status === 403) done(); else msg.textContent = e.message; });
  });
  cast.on(paint);
  paint();

  // ---------- coming back later: show characters already drawn ----------
  var d0 = saved();
  if (d0 && API) {
    req("GET", "/api/drafts/" + d0.id, d0).then(function (st) {
      status = st; showLeft();
      var ks = roles.map(function (r) { return r.key; }).filter(function (k) { return st.cartoons.indexOf(slot(k)) >= 0; });
      return Promise.all(ks.map(function (k) { return fetchToon(d0, k).catch(function () {}); }));
    }).then(function () { paint(); cast.changed(); }, function (e) { if (e.status === 404 || e.status === 403) forget(); });
  }
})();
