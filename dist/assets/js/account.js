/* Family Storybooks: "My orders" page.
   Customers sign in with Shopify's own one-time email code (Shopify customer accounts, Customer Account API,
   public client with PKCE), and we list their orders with status, tracking and their private book link.
   The Shopify store is shared by every Family Presents site, so orders are sorted into brands by SKU prefix
   (FST.brands). Nothing here holds a secret: the client ID is public, and the sign-in token stays in this tab
   (sessionStorage) until the customer signs out or closes it. */
(function () {
  "use strict";
  var F = window.FST, A = F.config.accounts || {};
  var root = document.getElementById("account");
  if (!root) return;
  var esc = F.esc;
  var HERE = location.origin + location.pathname;
  var KEY = "fst-account";
  var SCOPE = "openid email customer-account-api:full";

  function store(k, v) { try { if (v === undefined) return JSON.parse(sessionStorage.getItem(KEY + k) || "null"); if (v === null) sessionStorage.removeItem(KEY + k); else sessionStorage.setItem(KEY + k, JSON.stringify(v)); } catch (e) { return null; } }

  function show(html) { root.innerHTML = html; root.setAttribute("aria-busy", "false"); }
  function busy(text) { root.setAttribute("aria-busy", "true"); root.innerHTML = '<p class="acct-wait">' + esc(text) + "</p>"; }

  // ---------- Not switched on yet ----------
  if (!A.clientId || !A.shop) {
    show('<div class="acct-card"><h2>Order tracking opens with ordering</h2>' +
      "<p>When you order a storybook, you'll sign in here with a one-time code sent to your email to see your order, follow your parcel and approve your pages.</p>" +
      '<p>Ordered something already, or have a question? Email <a href="mailto:' + esc(F.config.email) + '">' + esc(F.config.email) + "</a> and we'll help.</p>" +
      '<p><a class="btn red" href="index.html#join">Join the list</a></p></div>');
    return;
  }

  // ---------- Shopify endpoints (found from the store, then remembered for this tab) ----------
  function endpoints() {
    var cached = store("-ep");
    if (cached) return Promise.resolve(cached);
    if (A.shopId) {
      var auth = "https://shopify.com/authentication/" + A.shopId;
      return Promise.resolve({ auth: auth + "/oauth/authorize", token: auth + "/oauth/token", logout: auth + "/logout",
        api: "https://shopify.com/" + A.shopId + "/account/customer/api/" + (A.apiVersion || "2025-07") + "/graphql" });
    }
    var base = "https://" + A.shop;
    return Promise.all([
      fetch(base + "/.well-known/openid-configuration").then(function (r) { return r.json(); }),
      fetch(base + "/.well-known/customer-account-api").then(function (r) { return r.json(); })
    ]).then(function (j) {
      var ep = { auth: j[0].authorization_endpoint, token: j[0].token_endpoint, logout: j[0].end_session_endpoint, api: j[1].graphql_api };
      store("-ep", ep);
      return ep;
    });
  }

  // ---------- PKCE helpers ----------
  function b64url(bytes) {
    var s = ""; bytes = new Uint8Array(bytes);
    for (var i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  function random(n) { var a = new Uint8Array(n); crypto.getRandomValues(a); return b64url(a); }
  function challenge(verifier) {
    return crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)).then(b64url);
  }

  function signIn() {
    busy("Taking you to sign in…");
    var verifier = random(48), state = random(16), nonce = random(16);
    store("-pkce", { verifier: verifier, state: state });
    Promise.all([endpoints(), challenge(verifier)]).then(function (r) {
      var q = new URLSearchParams({
        client_id: A.clientId, response_type: "code", redirect_uri: HERE, scope: SCOPE,
        state: state, nonce: nonce, code_challenge: r[1], code_challenge_method: "S256", locale: "en"
      });
      location.assign(r[0].auth + "?" + q.toString());
    }).catch(failed);
  }

  function signOut() {
    var t = store("-tok"), ep = store("-ep");
    store("-tok", null);
    if (ep && ep.logout && t && t.id) {
      location.assign(ep.logout + "?" + new URLSearchParams({ id_token_hint: t.id, post_logout_redirect_uri: HERE }).toString());
    } else signedOut();
  }

  function tokenRequest(params) {
    return endpoints().then(function (ep) {
      return fetch(ep.token, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(params) });
    }).then(function (r) {
      return r.json().then(function (j) { if (!r.ok || !j.access_token) throw new Error(j.error_description || j.error || "Sign-in failed"); return j; });
    }).then(function (j) {
      var t = { access: j.access_token, refresh: j.refresh_token, id: j.id_token || (store("-tok") || {}).id, until: Date.now() + (j.expires_in || 3600) * 1000 - 60000 };
      store("-tok", t);
      return t;
    });
  }

  // Back from Shopify's sign-in page with ?code=…
  function finishSignIn(params) {
    var p = store("-pkce");
    store("-pkce", null);
    history.replaceState(null, "", location.pathname);
    if (!p || params.get("state") !== p.state) return Promise.reject(new Error("The sign-in link expired. Please try again."));
    busy("Signing you in…");
    return tokenRequest({ grant_type: "authorization_code", client_id: A.clientId, redirect_uri: HERE, code: params.get("code"), code_verifier: p.verifier });
  }

  function token() {
    var t = store("-tok");
    if (!t) return Promise.resolve(null);
    if (Date.now() < t.until) return Promise.resolve(t);
    if (!t.refresh) { store("-tok", null); return Promise.resolve(null); }
    return tokenRequest({ grant_type: "refresh_token", client_id: A.clientId, refresh_token: t.refresh }).catch(function () { store("-tok", null); return null; });
  }

  // ---------- Orders ----------
  var ORDERS = "query { customer { firstName emailAddress { emailAddress } orders(first: 30, sortKey: PROCESSED_AT, reverse: true) { nodes {" +
    " id name processedAt statusPageUrl financialStatus totalPrice { amount currencyCode }" +
    " lineItems(first: 20) { nodes { title quantity sku variantTitle customAttributes { key value } } }" +
    " fulfillments(first: 5) { nodes { status latestShipmentStatus createdAt trackingInformation { number url company } } }" +
    " } } } }";

  function gql(t, query) {
    return endpoints().then(function (ep) {
      return fetch(ep.api, { method: "POST", headers: { "Content-Type": "application/json", Authorization: t.access }, body: JSON.stringify({ query: query }) });
    }).then(function (r) {
      if (r.status === 401) { store("-tok", null); throw Object.assign(new Error("Please sign in again."), { signin: true }); }
      return r.json();
    }).then(function (j) {
      if (j.errors) throw new Error(j.errors.map(function (e) { return e.message; }).join("; "));
      return j.data;
    });
  }

  function brandOf(order) {
    var skus = order.lineItems.nodes.map(function (l) { return l.sku || ""; });
    for (var i = 0; i < F.brands.length; i++) {
      var b = F.brands[i];
      if (skus.some(function (s) { return s.indexOf(b.prefix) === 0; })) return b;
    }
    return { id: "other", name: "Family Presents", url: "", prefix: "" };
  }

  function money(m) {
    var sym = { GBP: "£", EUR: "€" }[m.currencyCode];
    var n = Number(m.amount).toFixed(2);
    return sym ? sym + n : n + " " + m.currencyCode;
  }
  function day(iso) { return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }); }

  // Where an order is, in the four steps a customer cares about.
  var STEPS = ["Ordered", "Being made", "Posted", "Delivered"];
  function stage(o) {
    var f = o.fulfillments.nodes;
    if (f.some(function (x) { return x.latestShipmentStatus === "DELIVERED"; })) return 3;
    // We mark an order fulfilled (without tracking) when it goes to the printer, so it can't be cancelled from then on.
    // It counts as posted once the printer's tracking arrives.
    if (f.some(function (x) { return (x.trackingInformation || []).length; })) return 2;
    if (o.financialStatus === "PAID" || o.financialStatus === "PARTIALLY_REFUNDED") return 1;
    return 0;
  }

  function orderCard(o) {
    var s = stage(o), refunded = o.financialStatus === "REFUNDED" || o.financialStatus === "VOIDED";
    // The private book link travels as a line-item property ("Your book link"); Shopify's customer API has no order attributes.
    var attrs = {}; o.lineItems.nodes.forEach(function (l) { (l.customAttributes || []).forEach(function (a) { attrs[a.key] = a.value; }); });
    var link = attrs["Your book link"];
    var tracking = [];
    o.fulfillments.nodes.forEach(function (f) { (f.trackingInformation || []).forEach(function (t) { if (t.url || t.number) tracking.push(t); }); });
    var items = o.lineItems.nodes.map(function (l) {
      return "<li>" + esc(l.title) + (l.variantTitle ? ' <span class="muted">(' + esc(l.variantTitle) + ")</span>" : "") + (l.quantity > 1 ? " &times; " + l.quantity : "") + "</li>";
    }).join("");
    return '<article class="acct-order">' +
      '<div class="acct-order-head"><h3>Order ' + esc(o.name) + '</h3><p class="muted">' + day(o.processedAt) + " &middot; " + money(o.totalPrice) + "</p></div>" +
      (refunded ? '<p class="acct-flag">This order was cancelled and refunded.</p>' :
        '<ol class="acct-steps" aria-label="Order progress">' + STEPS.map(function (label, i) {
          return '<li class="' + (i < s ? "done" : i === s ? "now" : "") + '"' + (i === s ? ' aria-current="step"' : "") + ">" + label + "</li>";
        }).join("") + "</ol>") +
      "<ul class=\"acct-items\">" + items + "</ul>" +
      '<div class="acct-actions">' +
      (link && !refunded && s < 2 ? '<a class="btn btn-sm red" href="' + esc(link) + '">See and approve your pages</a>' : "") +
      tracking.map(function (t) {
        return t.url ? '<a class="btn btn-sm" href="' + esc(t.url) + '" target="_blank" rel="noopener">Track parcel' + (t.company ? " (" + esc(t.company) + ")" : "") + "</a>"
          : '<span class="muted">Tracking number ' + esc(t.number) + "</span>";
      }).join("") +
      (o.statusPageUrl ? '<a class="btn btn-sm ghost" href="' + esc(o.statusPageUrl) + '" target="_blank" rel="noopener">Order details</a>' : "") +
      (link && !refunded && s >= 1 ? '<button type="button" class="btn btn-sm ghost" data-problem="' + esc(link) + '" data-order="' + esc(o.name) + '">Report a problem</button>' : "") +
      "</div></article>";
  }

  function render(data) {
    var c = data.customer, mine = [], others = {};
    c.orders.nodes.forEach(function (o) {
      var b = brandOf(o);
      if (b.id === A.brand) mine.push(o);
      else (others[b.id] = others[b.id] || { brand: b, list: [] }).list.push(o);
    });
    var hello = c.firstName ? "Hello, " + esc(c.firstName) : "Signed in";
    var email = c.emailAddress ? c.emailAddress.emailAddress : "";
    var otherHtml = Object.keys(others).map(function (k) {
      var x = others[k], n = x.list.length;
      return "<li>You also have " + n + " " + esc(x.brand.name) + " " + (n === 1 ? "order" : "orders") + ": " +
        x.list.map(function (o) {
          return o.statusPageUrl ? '<a href="' + esc(o.statusPageUrl) + '" target="_blank" rel="noopener">' + esc(o.name) + "</a>" : esc(o.name);
        }).join(", ") + ".</li>";
    }).join("");
    show('<div class="acct-top"><div><h2>' + hello + "</h2>" + (email ? '<p class="muted">Signed in as ' + esc(email) + "</p>" : "") + "</div>" +
      '<button type="button" class="btn btn-sm ghost" data-signout>Sign out</button></div>' +
      (mine.length ? mine.map(orderCard).join("") :
        '<div class="acct-card"><h3>No storybook orders yet</h3><p>When you order a storybook it will appear here, with your private link to see and approve every page.</p><p><a class="btn red" href="index.html#stories">Choose a story</a></p></div>') +
      (otherHtml ? '<ul class="acct-others">' + otherHtml + "</ul>" : "") +
      '<p class="small muted">Questions about an order? Email <a href="mailto:' + esc(F.config.email) + '">' + esc(F.config.email) + "</a> with your order number.</p>");
  }

  function signedOut() {
    show('<div class="acct-card"><h2>Sign in to see your orders</h2>' +
      "<p>Enter your email on the next page and we'll send you a one-time code. No password needed.</p>" +
      "<p>Use the email address you ordered with.</p>" +
      '<p><button type="button" class="btn red" data-signin>Sign in with email</button></p></div>');
  }

  function failed(err) {
    if (err && err.signin) return signedOut();
    show('<div class="acct-card"><h2>Something went wrong</h2><p>' + esc((err && err.message) || "Please try again.") + "</p>" +
      '<p><button type="button" class="btn red" data-signin>Try again</button></p>' +
      '<p class="small">Still stuck? Email <a href="mailto:' + esc(F.config.email) + '">' + esc(F.config.email) + "</a>.</p></div>");
  }

  // ---------- Report a problem ----------
  // Reason, a few words and up to 4 photos (made smaller here first), sent with the book's private link,
  // so only the family who ordered can report. We email back with a reprint or a refund.
  var REASONS = [["damaged", "Arrived damaged"], ["fault", "Printing fault"], ["proof", "Doesn't match the proof I approved"], ["lost", "Parcel hasn't arrived"], ["other", "Something else"]];
  function bookFromLink(link) {
    try { var u = new URL(link, location.href); return { id: u.searchParams.get("d"), token: decodeURIComponent(u.hash.slice(1)) }; } catch (e) { return {}; }
  }
  function shrink(file) {
    return new Promise(function (ok, fail) {
      var img = new Image(), url = URL.createObjectURL(file);
      img.onload = function () {
        var k = Math.min(1, 1600 / Math.max(img.width, img.height)), c = document.createElement("canvas");
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
        ok(c.toDataURL("image/jpeg", 0.85).split(",")[1]);
      };
      img.onerror = function () { URL.revokeObjectURL(url); fail(new Error("We couldn't read one of the photos. Please try a JPEG or PNG.")); };
      img.src = url;
    });
  }
  function problemForm(btn) {
    var art = btn.closest(".acct-order"), old = art.querySelector(".acct-problem");
    if (old) { old.remove(); return; }
    var form = document.createElement("form");
    form.className = "acct-problem"; form.noValidate = true;
    form.innerHTML = "<h4>Report a problem with order " + esc(btn.dataset.order) + "</h4>" +
      "<p class=\"small muted\">Tell us what's wrong and add photos if you can. We'll email you, usually within a working day, to put it right with a reprint or a refund.</p>" +
      '<label>What\'s wrong?<select name="reason" required><option value="">Choose one</option>' + REASONS.map(function (r) { return '<option value="' + r[0] + '">' + r[1] + "</option>"; }).join("") + "</select></label>" +
      '<label>Tell us more<textarea name="details" rows="4" maxlength="2000" required></textarea></label>' +
      '<label>Photos (up to 4)<input type="file" name="photos" accept="image/*" multiple></label>' +
      '<p class="acct-problem-msg" role="status"></p>' +
      '<div class="acct-actions"><button type="submit" class="btn btn-sm red">Send report</button><button type="button" class="btn btn-sm ghost" data-cancel>Cancel</button></div>';
    art.appendChild(form);
    form.querySelector("[data-cancel]").addEventListener("click", function () { form.remove(); });
    form.addEventListener("input", function () { var m = form.querySelector(".acct-problem-msg"); if (m && !form.querySelector("[type=submit]").disabled) m.textContent = ""; });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var msg = form.querySelector(".acct-problem-msg"), send = form.querySelector("[type=submit]");
      var reason = form.reason.value, details = form.details.value.trim(), files = Array.prototype.slice.call(form.photos.files || []);
      if (!reason) { msg.textContent = "Please choose what's wrong."; return; }
      if (details.length < 5) { msg.textContent = "Please tell us a little about the problem."; return; }
      if (files.length > 4) { msg.textContent = "Please choose at most 4 photos."; return; }
      var book = bookFromLink(btn.dataset.problem);
      if (!book.id || !book.token) { msg.innerHTML = 'Please email <a href="mailto:' + esc(F.config.email) + '">' + esc(F.config.email) + "</a> with your order number and photos."; return; }
      send.disabled = true; msg.textContent = "Sending…";
      Promise.all(files.map(shrink)).then(function (photos) {
        return fetch(F.config.api.replace(/\/+$/, "") + "/api/drafts/" + book.id + "/problems", {
          method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + book.token },
          body: JSON.stringify({ reason: reason, details: details, photos: photos })
        }).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw new Error(j.error || "Something went wrong."); return j; }); });
      }).then(function () {
        form.innerHTML = "<h4>Thank you, we've got your report</h4><p>We'll email you soon to put it right. If you need to add anything, reply to that email.</p>";
      }).catch(function (err) {
        send.disabled = false;
        msg.innerHTML = esc(err.message) + ' You can also email <a href="mailto:' + esc(F.config.email) + '">' + esc(F.config.email) + "</a>.";
      });
    });
    form.reason.focus();
  }

  root.addEventListener("click", function (e) {
    if (e.target.closest("[data-signin]")) signIn();
    if (e.target.closest("[data-signout]")) signOut();
    var pb = e.target.closest("[data-problem]"); if (pb) problemForm(pb);
  });

  var params = new URLSearchParams(location.search);
  if (params.get("error")) { history.replaceState(null, "", location.pathname); failed(new Error("Sign-in was cancelled.")); return; }
  (params.get("code") ? finishSignIn(params) : token()).then(function (t) {
    if (!t) return signedOut();
    busy("Finding your orders…");
    return gql(t, ORDERS).then(render);
  }).catch(failed);
})();
