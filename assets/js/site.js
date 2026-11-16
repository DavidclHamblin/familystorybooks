/* Family Storybooks: shared page behaviour (wordmark, story shelf arrows, sign-up forms). */
(function () {
  "use strict";
  var F = window.FST;
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  // Wordmark: colour each letter like the pages of the family ABC book.
  $$(".wordmark").forEach(function (el) {
    var i = 0;
    el.innerHTML = el.textContent.trim().split(" ").map(function (word) {
      return '<span class="w">' + word.split("").map(function (ch) { i++; return '<span class="l" style="--i:' + i + '">' + F.esc(ch) + "</span>"; }).join("") + "</span>";
    }).join(" ");
  });

  // Story shelf arrows, and "Notify me" picking that story in the sign-up form.
  var shelf = $("#shelf");
  if (shelf) {
    var prev = $("#shelf-prev"), next = $("#shelf-next");
    function upd() {
      prev.disabled = shelf.scrollLeft < 8;
      next.disabled = shelf.scrollLeft + shelf.clientWidth > shelf.scrollWidth - 8;
    }
    function step(dir) { shelf.scrollBy({ left: dir * (shelf.clientWidth * 0.8), behavior: "smooth" }); }
    prev.addEventListener("click", function () { step(-1); });
    next.addEventListener("click", function () { step(1); });
    shelf.addEventListener("scroll", upd, { passive: true });
    window.addEventListener("resize", upd);
    upd();
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest("[data-soon]"); if (!a) return;
    var sel = $("#w-story"); if (sel) sel.value = a.dataset.soon;
    setTimeout(function () { var em = $("#w-email"); if (em) em.focus({ preventScroll: true }); }, 400);
  });

  // Sign-up forms
  $$("form[data-signup]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var msg = $(".form-msg", form), data = {};
      new FormData(form).forEach(function (v, k) { data[k] = v; });
      data.form = form.dataset.signup;
      if (!data.email || !/^\S+@\S+\.\S+$/.test(data.email)) { msg.textContent = "Please enter an email address like name@example.com."; return; }
      var btn = $("button[type=submit]", form); if (btn) btn.disabled = true;
      send(data).then(function (sent) {
        if (btn) btn.disabled = false;
        msg.textContent = sent ? "You're on the list. We'll email you when ordering opens." : "Sorry, that didn't go through. Please try again, or email " + F.config.email + ".";
        if (sent) form.reset();
      });
    });
  });

  function send(data) {
    if (!F.config.formEndpoint) return Promise.resolve(false);
    var body = Object.assign({
      _subject: "Family Storybooks waitlist: " + (data.story || ""),
      _template: "table",
      _replyto: data.email,
      site: "familiestorybooks.co.uk"
    }, data);
    return fetch(F.config.formEndpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(body) })
      .then(function (r) { return r.ok ? r.json().then(function (j) { return String(j.success) === "true"; }, function () { return true; }) : false; })
      .catch(function () { return false; });
  }

  $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
