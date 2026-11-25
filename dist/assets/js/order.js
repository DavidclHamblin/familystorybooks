/* Family Storybooks: ordering a book (story pages, "Order your book").
   Saves the family's names on the drawing service's draft (print.js reads them from there), then makes a Shopify
   cart and sends the customer to Shopify's own secure checkout. The order line carries the draft id (_draft), which
   the cartoon service's order-paid webhook uses to mark the book paid and keep the delivery address for the printer.
   Checkout is on when FST.config.shopify.checkoutLive is true, or for testing with #shoptest in the address. */
(function () {
  "use strict";
  var F = window.FST, esc = F.esc, S = F.config.shopify || {};
  var root = document.querySelector("[data-order]");
  if (!root || !F.cast) return;
  var cast = F.cast, key = cast.story, story = F.stories[key], roles = story.roles;
  var API = (function () { try { return localStorage.getItem("fst-api"); } catch (e) { return ""; } })() || F.config.api || "";
  API = API.replace(/\/+$/, "");
  var GQL = "https://" + S.domain + "/api/" + (S.apiVersion || "2025-07") + "/graphql.json";
  var copies = 0, busy = false, note = "";

  function live() { return !!(S.domain && S.token) && (!!S.checkoutLive || /shoptest/.test(location.hash)); }
  function draft() { try { var d = JSON.parse(localStorage.getItem("fst-toon-" + key) || "null"); return d && d.id && d.token ? d : null; } catch (e) { return null; } }
  function hero() { return roles.filter(function (r) { return r.required; })[0] || roles[0]; }
  function starring() { return roles.map(function (r) { return cast.name(r.key); }).join(", ").replace(/, ([^,]*)$/, " and $1"); }
  function proofLink(d) { return (F.config.site || location.origin) + "/proof.html?d=" + d.id + "#" + d.token; }

  function gql(query, variables) {
    return fetch(GQL, { method: "POST", headers: { "Content-Type": "application/json", "X-Shopify-Storefront-Access-Token": S.token },
      body: JSON.stringify({ query: query, variables: variables || {} }) })
      .then(function (r) { return r.json(); }).then(function (j) {
        if (j.errors) throw new Error(j.errors.map(function (e) { return e.message; }).join("; "));
        return j.data;
      });
  }
  function attrs(o) {
    return Object.keys(o).filter(function (k) { return o[k] !== "" && o[k] != null; }).map(function (k) { return { key: k, value: String(o[k]).slice(0, 2000) }; });
  }

  // What still stops this book from being ordered, in the order the family meets it.
  function missing() {
    var h = hero(), d = draft();
    if (!(cast.names[h.key] || "").trim()) return "Please type a name for " + h.name + " in “Meet your characters” above.";
    if (!d || !cast.toons[h.key]) return "Draw your characters above first, starting with " + (cast.names[h.key] || "your child") + " as " + h.name + ".";
    return "";
  }

  function checkout() {
    var d = draft(), why = missing();
    if (why) { note = why; return paint(); }
    busy = true; note = "Getting your checkout ready…"; paint();
    var names = Object.assign({}, cast.names);
    Object.keys(names).forEach(function (k) { names[k] = String(names[k] || "").trim().slice(0, k === "dedication" ? 160 : 24); });
    // 1. Save the names on the draft, so the printed book uses exactly what the family typed.
    fetch(API + "/api/drafts/" + d.id, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: "Bearer " + d.token },
      body: JSON.stringify({ cover: { story: key, names: names } }) })
      .then(function (r) { if (!r.ok) throw new Error(r.status === 404 || r.status === 403 ? "Your characters have expired. Please draw them again." : "We couldn't save your book. Please try again."); })
      // 2. Shopify: the book line and any extra copies, both tagged with the draft.
      .then(function () { return gql("query($h:String!){product(handle:$h){variants(first:10){nodes{id sku availableForSale}}}}", { h: S.handle }); })
      .then(function (data) {
        if (!data.product) throw new Error("Ordering isn't open yet. Please try again soon.");
        var v = {}; data.product.variants.nodes.forEach(function (n) { v[n.sku] = n.id; });
        if (!v["FST-BOOK"]) throw new Error("Ordering isn't open yet. Please try again soon.");
        var common = { _draft: d.id, Story: story.name };
        var lines = [{ merchandiseId: v["FST-BOOK"], quantity: 1, attributes: attrs(Object.assign({}, common, {
          "Starring": starring(), "Your book link": proofLink(d), "_Dedication": names.dedication || "" })) }];
        if (copies > 0 && v["FST-COPY"]) lines.push({ merchandiseId: v["FST-COPY"], quantity: copies, attributes: attrs(Object.assign({}, common, { "Copy of": story.name + " starring " + cast.name(hero().key) })) });
        var r = F.regionInfo ? F.regionInfo() : {};
        var input = { lines: lines, attributes: attrs({ Source: "familystorybooks.co.uk", Region: r.name || "", _draft: d.id }) };
        if (F.region === "uk") input.buyerIdentity = { countryCode: "GB" };
        return gql("mutation($input:CartInput!){cartCreate(input:$input){cart{checkoutUrl} userErrors{message}}}", { input: input });
      })
      .then(function (data) {
        var res = data.cartCreate;
        if (res.userErrors && res.userErrors.length) throw new Error(res.userErrors.map(function (e) { return e.message; }).join("; "));
        note = "Taking you to our secure checkout…"; paint();
        location.href = res.cart.checkoutUrl;
      })
      .catch(function (e) { busy = false; note = e.message || "Something went wrong. Please try again."; paint(); });
  }

  function paint() {
    var b = F.prices.book, c = F.prices.copy, total = F.amount(b.price) + copies * F.amount(c.price), cur = F.regionInfo().currency;
    if (!live()) {
      root.innerHTML = '<div class="ord-closed"><h3>Ordering opens soon</h3><p>Draw your characters now and they\'ll be waiting for you. Join our list and we\'ll email you when ordering opens, with ' +
        F.config.foundingDiscount + '% off your first book.</p><a class="btn red" href="#join">Join the list</a></div>';
      return;
    }
    var h = hero(), ded = (cast.names.dedication || "").trim(), why = missing();
    var opts = ""; for (var i = 0; i <= (S.maxCopies || 5); i++) opts += '<option value="' + i + '"' + (i === copies ? " selected" : "") + ">" + (i ? i + " extra (" + cur + F.amount(c.price) + " each)" : "None") + "</option>";
    root.innerHTML =
      '<dl class="ord-sum">' +
      "<div><dt>Story</dt><dd>" + esc(story.name) + "</dd></div>" +
      "<div><dt>Starring</dt><dd>" + esc(starring()) + "</dd></div>" +
      "<div><dt>" + esc(h.name) + " is a</dt><dd>" + (cast.names.pron === "he" ? "Boy (he)" : "Girl (she)") + "</dd></div>" +
      "<div><dt>Dedication</dt><dd>" + (ded ? esc(ded) : '<span class="muted">Our own words (write yours in “Try it with your names”)</span>') + "</dd></div>" +
      "</dl>" +
      '<label class="field ord-copies"><span>Extra copies of the same book</span><select data-copies>' + opts + "</select></label>" +
      '<p class="ord-total">Total <b>' + cur + total + '</b> <span class="muted">plus delivery, shown at checkout</span></p>' +
      '<button type="button" class="btn red ord-go"' + (busy ? " disabled" : "") + ">" + (busy ? "Please wait…" : "Order my book") + "</button>" +
      '<p class="ord-msg" role="status" aria-live="polite">' + esc(note || why) + "</p>" +
      '<p class="small muted">After you pay, we paint every page with your family and email you a private link when they’re ready, usually within a few hours. Checking them is optional: you can ask for any page to be painted again, or approve it to print straight away. If you don’t, we print your book as it is four days after the pages are ready, so a gift isn’t delayed. ' +
      "Please give a phone number at checkout: our printer's courier needs it.</p>";
  }

  root.addEventListener("click", function (e) { if (e.target.closest(".ord-go") && !busy) checkout(); });
  root.addEventListener("change", function (e) { if (e.target.matches("[data-copies]")) { copies = Math.max(0, Math.min(S.maxCopies || 5, +e.target.value || 0)); paint(); } });
  cast.on(function () { if (!busy) { note = ""; paint(); } });
  window.addEventListener("hashchange", paint);
  paint();
})();
