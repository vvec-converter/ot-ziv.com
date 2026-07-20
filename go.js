(function () {
  try {
    var t = localStorage.getItem("t");
    document.documentElement.setAttribute("data-theme", t === "light" ? "light" : "dark");
  } catch (e) {}

  function loadMassag(done) {
    if (typeof ozSendReview === "function" && typeof OZ_SEND_URL === "string") {
      done();
      return;
    }
    window.__OZ_FROM_GO = true;
    window.__OZ_K = "k9m2p7x4w1q8";
    var s = document.createElement("script");
    s.src = "massag.js";
    s.async = true;
    s.onload = function () {
      done();
    };
    s.onerror = function () {
      console.error("massag.js не загрузился");
      done();
    };
    document.head.appendChild(s);
  }

  loadMassag(function () {
    boot();
  });

  function boot() {
    console.log(
      "Это сайт отзыв (ot-ziv.com) и не имеет отношения к сайту отзовик (otzovik — от слова «отзывать документы»: отзывающий претензию или иск). Слово «отзыв» — публикуемый материал о чём-либо, характеризующий его хорошую или плохую деятельность."
    );
    var darkSwitch = document.getElementById("darkSwitch");
    if (darkSwitch) {
      var saved = localStorage.getItem("t");
      var dark = saved !== "light";
      document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
      darkSwitch.checked = dark;
      darkSwitch.addEventListener("change", function () {
        var on = darkSwitch.checked;
        document.documentElement.setAttribute("data-theme", on ? "dark" : "light");
        localStorage.setItem("t", on ? "dark" : "light");
      });
    }
    var stepForm = document.getElementById("ba");
    var stepPreview = document.getElementById("o");
    var stepDone = document.getElementById("az");
    var stepMine = document.getElementById("bb");
    var form = document.getElementById("u");
    var previewList = document.getElementById("l");
    var formErr = document.getElementById("bj");
    function esc(s) {
      return String(s || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    }
    function val(id) {
      var el = document.getElementById(id);
      return el ? el.value.trim() : "";
    }
    function showErr(msg) {
      if (!formErr) return;
      formErr.textContent = msg;
      formErr.classList.add("dr");
    }
    function hideErr() {
      if (formErr) formErr.classList.remove("dr");
    }
    function ozSetCuTab(tab) {
      var nav = document.getElementById("cu");
      if (!nav) return;
      if (!nav.querySelector("a.ar") && !nav.querySelector("a.cq")) return;
      var links = nav.querySelectorAll("a");
      for (var i = 0; i < links.length; i++) links[i].classList.remove("dy");
      var target = null;
      if (tab === "mine") target = nav.querySelector("a.cq");
      else if (tab === "reviews") target = nav.querySelector('a[href*="otzyvy"]');
      else target = nav.querySelector("a.ar") || document.getElementById("bv");
      if (target) target.classList.add("dy");
    }
    function showStep(step) {
      if (stepForm) stepForm.hidden = step !== "form";
      if (stepPreview) stepPreview.hidden = step !== "preview";
      if (stepDone) stepDone.hidden = step !== "done";
      if (stepMine) stepMine.hidden = step !== "mine";
      if (form) form.hidden = step === "done" || step === "mine";
      if (step === "mine") ozSetCuTab("mine");
      else if (stepForm || stepMine) ozSetCuTab("home");
      window.scrollTo({ top: 0, behavior: "smooth" });
      if (step === "preview") {
        setTimeout(ozRenderTurnstile, 150);
      }
    }
    var catSelect = document.getElementById("r");
    document.querySelectorAll("a[data-cat]").forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        var cat = a.getAttribute("data-cat") || "";
        if (!catSelect || !cat) return;
        showStep("form");
        catSelect.value = cat;
        try {
          catSelect.dispatchEvent(new Event("change", { bubbles: true }));
        } catch (err) {}
        setTimeout(function () {
          try {
            catSelect.focus();
          } catch (err2) {}
        }, 80);
      });
    });
    var ozTsWidget = null;
    function ozTsTheme() {
      return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
    }
    function ozRenderTurnstile() {
      var box = document.getElementById("h");
      if (!box || !OZ_TS_KEY) return;
      function run() {
        if (typeof turnstile === "undefined") {
          setTimeout(run, 80);
          return;
        }
        if (ozTsWidget !== null) {
          try {
            turnstile.reset(ozTsWidget);
          } catch (ex) {}
          return;
        }
        ozTsWidget = turnstile.render(box, { sitekey: OZ_TS_KEY, theme: ozTsTheme() });
      }
      run();
    }
    function previewRow(label, text) {
      return (
        '<div class="s"><dt>' +
        esc(label) +
        "</dt><dd>" +
        esc(text) +
        "</dd></div>"
      );
    }
    function ozMakeId() {
      return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    }
    function ozGetLatest() {
      try {
        var all = JSON.parse(localStorage.getItem("c") || "{}");
        var latest = null;
        Object.keys(all).forEach(function (k) {
          var it = all[k];
          if (!it || !it.ts) return;
          if (!latest || it.ts > latest.ts) latest = it;
        });
        return latest;
      } catch (e) {
        return null;
      }
    }
    function ozGetById(id) {
      if (!id) return null;
      try {
        var all = JSON.parse(localStorage.getItem("c") || "{}");
        return all[id] || null;
      } catch (e) {
        return null;
      }
    }
    function ozHashId() {
      var h = (location.hash || "").replace(/^#/, "").trim();
      if (!h || /^mine$/i.test(h) || /^my$/i.test(h)) return "";
      if (h.indexOf("review:") === 0) h = h.slice(7);
      return h;
    }
    function ozIsMineHash() {
      var h = (location.hash || "").replace(/^#/, "").trim();
      return /^mine$/i.test(h) || /^my$/i.test(h);
    }
    function ozSetReviewHash(id) {
      if (!id) return;
      var next = "#" + id;
      if (location.hash !== next) {
        try {
          history.replaceState(null, "", next);
        } catch (e) {
          location.hash = id;
        }
      }
    }
    function ozSetMineHash() {
      if (ozIsMineHash()) return;
      try {
        history.replaceState(null, "", "#mine");
      } catch (e) {
        location.hash = "mine";
      }
    }
    function ozClearReviewHash() {
      if (!location.hash) return;
      try {
        history.replaceState(null, "", location.pathname + location.search);
      } catch (e) {
        location.hash = "";
      }
    }
    function fillItemPreview(box, item) {
      if (!box || !item) return false;
      var rating = +item.rating || 5;
      var stars = "★".repeat(rating) + "☆".repeat(5 - rating);
      var mail = item.mail || "не указан";
      var tags = item.tags || "—";
      box.innerHTML =
        previewRow("Категория", item.category) +
        previewRow("Название", item.name) +
        previewRow("Ваше имя", item.user) +
        previewRow("E-mail", mail) +
        previewRow("Текст поста", item.text) +
        previewRow("Теги", tags) +
        '<div class="s"><dt>Оценка</dt><dd><span class="g" aria-label="' +
        rating +
        ' из 5">' +
        stars +
        "</span> (" +
        rating +
        " из 5)</dd></div>";
      return true;
    }
    var OZ_PUBLISHED_URL = "/data/published.json";
    function ozFetchPublished() {
      return fetch(OZ_PUBLISHED_URL + "?t=" + Date.now())
        .then(function (r) {
          if (!r.ok) return [];
          return r.json();
        })
        .then(function (d) {
          return Array.isArray(d) ? d : (d && d.ids) || [];
        })
        .catch(function () {
          return [];
        });
    }
    function ozMarkPublished(id) {
      if (!id) return;
      try {
        var all = JSON.parse(localStorage.getItem("c") || "{}");
        if (all[id]) {
          all[id].published = true;
          localStorage.setItem("c", JSON.stringify(all));
        }
      } catch (e) {}
    }
    function ozCheckPublished(item) {
      if (!item || !item.id) return Promise.resolve(false);
      if (item.published) return Promise.resolve(true);
      return ozFetchPublished().then(function (ids) {
        var pub = ids.some(function (x) {
          if (typeof x === "string") return x === item.id;
          return x && x.id === item.id;
        });
        if (pub) ozMarkPublished(item.id);
        return pub;
      });
    }
    function ozReviewPublicUrl(item) {
      if (!item) return "/otziv.html";
      var name = String(item.name || "").trim();
      var slug = name
        .toLowerCase()
        .replace(/ё/g, "е")
        .replace(/[^a-z0-9а-я]+/gi, "-")
        .replace(/^-+|-+$/g, "");
      var key = slug || item.id || "";
      return "/otziv.html?id=" + encodeURIComponent(key);
    }
    function ozSetViewLink(item, published) {
      var a = document.getElementById("oz-view-pub");
      if (!a) return;
      if (!published || !item || !item.id) {
        a.hidden = true;
        a.style.display = "none";
        return;
      }
      a.href = ozReviewPublicUrl(item);
      a.hidden = false;
      a.style.display = "block";
    }
    function ozSetModBadge(badge, published) {
      if (!badge) return;
      if (published) {
        badge.className = "aw dw";
        badge.innerHTML = '<span class="du" aria-hidden="true">✓</span> Опубликован';
      } else {
        badge.className = "aw";
        badge.textContent = "Не опубликован · на модерации";
      }
    }
    function showMyReview(wantId) {
      hideErr();
      var box = document.getElementById("k");
      var empty = document.getElementById("ad");
      var badge = document.getElementById("ac");
      var id = wantId || ozHashId();
      var item = id ? ozGetById(id) : ozGetLatest();
      if (item && item.id) ozSetReviewHash(item.id);
      else ozSetMineHash();
      if (fillItemPreview(box, item)) {
        if (empty) empty.hidden = true;
        if (badge) badge.hidden = false;
        if (box) box.hidden = false;
        ozSetModBadge(badge, !!(item && item.published));
        ozSetViewLink(item, !!(item && item.published));
        if (item) {
          ozCheckPublished(item).then(function (pub) {
            ozSetModBadge(badge, pub);
            ozSetViewLink(item, pub);
          });
        }
      } else {
        if (box) {
          box.innerHTML = "";
          box.hidden = true;
        }
        if (empty) empty.hidden = false;
        if (badge) badge.hidden = true;
        ozSetViewLink(null, false);
      }
      showStep("mine");
      if (typeof setDrawer === "function") setDrawer(false);
    }
    function fillPreview() {
      if (!previewList) return;
      var rating = +val("as") || 5;
      var stars = "★".repeat(rating) + "☆".repeat(5 - rating);
      var mail = val("ca") || "не указан";
      var tags = val("cc") || "—";
      previewList.innerHTML =
        previewRow("Категория", val("r")) +
        previewRow("Название", val("aa")) +
        previewRow("Ваше имя", val("cb")) +
        previewRow("E-mail", mail) +
        previewRow("Текст поста", val("cd")) +
        previewRow("Теги", tags) +
        '<div class="s"><dt>Оценка</dt><dd><span class="g" aria-label="' +
        rating +
        ' из 5">' +
        stars +
        "</span> (" +
        rating +
        " из 5)</dd></div>";
    }
    function validateForm() {
      if (!form) return false;
      return form.reportValidity();
    }
    function fillDonePreview() {
      var box = document.getElementById("i");
      if (!box) return;
      fillItemPreview(box, {
        category: val("r"),
        name: val("aa"),
        user: val("cb"),
        mail: val("ca"),
        text: val("cd"),
        tags: val("cc"),
        rating: val("as"),
      });
      box.hidden = true;
    }
    function ozSaveCache(id) {
      if (!id) id = ozMakeId();
      var item = {
        id: id,
        ts: Date.now(),
        published: false,
        category: val("r"),
        name: val("aa"),
        user: val("cb"),
        mail: val("ca"),
        text: val("cd"),
        tags: val("cc"),
        rating: val("as"),
      };
      try {
        var all = JSON.parse(localStorage.getItem("c") || "{}");
        all[id] = item;
        var cut = Date.now() - 30 * 24 * 60 * 60 * 1000;
        Object.keys(all).forEach(function (k) {
          if (!all[k].ts || all[k].ts < cut) delete all[k];
        });
        localStorage.setItem("c", JSON.stringify(all));
      } catch (e) {}
      return id;
    }
    var btnPreview = document.getElementById("q");
    if (btnPreview) {
      btnPreview.addEventListener("click", function () {
        hideErr();
        if (!validateForm()) return;
        fillPreview();
        showStep("preview");
      });
    }
    var btnEdit = document.getElementById("bd");
    if (btnEdit) {
      btnEdit.addEventListener("click", function () {
        hideErr();
        if (ozTsWidget !== null && window.turnstile) {
          try {
            turnstile.remove(ozTsWidget);
          } catch (ex) {}
          ozTsWidget = null;
        }
        var box = document.getElementById("h");
        if (box) box.innerHTML = "";
        showStep("form");
      });
    }
    if (form) {
      form.addEventListener("submit", function (e) {
        if (stepPreview.hidden) {
          e.preventDefault();
          return;
        }
        e.preventDefault();
        hideErr();
        var ts = form.querySelector("[name='cf-turnstile-response']");
        if (!ts || !ts.value) {
          showErr('Пройдите проверку «Подтвердите, что вы человек» на этом шаге.');
          return;
        }
        if (typeof ozSendReview !== "function") {
          showErr("Ошибка: massag.js не загружен. Обновите страницу.");
          return;
        }
        var btn = document.getElementById("p");
        if (btn) {
          btn.disabled = true;
          btn.textContent = "Отправка…";
        }
        var rid = ozMakeId();
        var ridEl = form.querySelector("[name=review_id]");
        if (!ridEl) {
          ridEl = document.createElement("input");
          ridEl.type = "hidden";
          ridEl.name = "review_id";
          form.appendChild(ridEl);
        }
        ridEl.value = rid;
        var gotchaEl = form.querySelector("[name=_gotcha]");
        var payload = {
          category: val("r"),
          company_name: val("aa"),
          user_name: val("cb"),
          user_mail: val("ca"),
          text_review: val("cd"),
          TAGS: val("cc"),
          rating: val("as"),
          review_id: rid,
          "cf-turnstile-response": ts.value,
          _gotcha: gotchaEl ? gotchaEl.value : "",
        };
        var body = new URLSearchParams();
        Object.keys(payload).forEach(function (k) {
          body.append(k, payload[k]);
        });
        ozSendReview(body)
          .then(function (res) {
            if (res.ok) {
              var sid = (res.data && res.data.id) || rid;
              ozSaveCache(sid);
              ozSetReviewHash(sid);
              fillDonePreview();
              showStep("done");
              return;
            }
            var msg =
              (res.data && res.data.error) || "Ошибка " + res.status + ". Попробуйте снова.";
            showErr(msg);
            showStep("preview");
            if (ozTsWidget !== null && window.turnstile) {
              try {
                turnstile.reset(ozTsWidget);
              } catch (ex) {}
            }
          })
          .catch(function () {
            showErr("Ошибка сети. Проверьте интернет и попробуйте снова.");
          })
          .finally(function () {
            var b = document.getElementById("p");
            if (b) {
              b.disabled = false;
              b.textContent = "Отправить на модерацию";
            }
          });
      });
    }
    var stars = document.querySelectorAll("#db .ds");
    var hid = document.getElementById("as");
    function paint(n) {
      stars.forEach(function (s) {
        s.classList.toggle("dv", +s.dataset.v <= n);
      });
      hid.value = n;
    }
    stars.forEach(function (s) {
      s.addEventListener("click", function () {
        paint(+s.dataset.v);
        s.blur();
      });
    });
    paint(5);
    var doneLink = document.getElementById("an");
    if (doneLink) {
      doneLink.addEventListener("click", function () {
        var p = document.getElementById("i");
        if (!p) return;
        p.hidden = !p.hidden;
        doneLink.textContent = p.hidden ? "Мой отзыв" : "Скрыть отзыв";
      });
    }
    document.querySelectorAll(".cq").forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        showMyReview();
      });
    });
    var mineBack = document.getElementById("av");
    if (mineBack) {
      mineBack.addEventListener("click", function () {
        ozClearReviewHash();
        showStep("form");
      });
    }
    if (ozIsMineHash()) {
      showMyReview();
    } else if (ozHashId()) {
      showMyReview(ozHashId());
    }
    window.addEventListener("hashchange", function () {
      if (ozIsMineHash()) showMyReview();
      else {
        var hid = ozHashId();
        if (hid) showMyReview(hid);
      }
    });
    var btn = document.getElementById("bm");
    var topBar = document.getElementById("cg");
    var drawer = document.getElementById("cn");
    function setDrawer(open) {
      if (!drawer || !btn) return;
      drawer.classList.toggle("dp", open);
      if (topBar) topBar.classList.toggle("au", open);
      btn.classList.toggle("ce", open);
      btn.textContent = open ? "×" : "☰";
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      btn.setAttribute("aria-label", open ? "Закрыть меню" : "Меню");
      drawer.setAttribute("aria-hidden", open ? "false" : "true");
    }
    if (btn && drawer) {
      btn.addEventListener("click", function () {
        setDrawer(!drawer.classList.contains("dp"));
      });
      drawer.querySelectorAll("a").forEach(function (a) {
        a.addEventListener("click", function () {
          setDrawer(false);
        });
      });
    }
    var cats = document.getElementById("bn");
    var cPrev = document.getElementById("ak");
    var cNext = document.getElementById("aj");
    function updCats() {
      if (!cats || !cPrev || !cNext) return;
      cPrev.disabled = cats.scrollLeft <= 2;
      cNext.disabled = cats.scrollLeft + cats.clientWidth >= cats.scrollWidth - 2;
    }
    if (cats && cPrev && cNext) {
      cPrev.addEventListener("click", function () {
        cats.scrollBy({ left: -180, behavior: "smooth" });
      });
      cNext.addEventListener("click", function () {
        cats.scrollBy({ left: 180, behavior: "smooth" });
      });
      cats.addEventListener("scroll", updCats);
      window.addEventListener("resize", updCats);
      updCats();
    }
    document.querySelectorAll(".bi").forEach(function (btn) {
      var block = btn.closest(".y");
      var panel = document.getElementById(btn.getAttribute("aria-controls"));
      function mob() {
        return window.matchMedia("(max-width:767px)").matches;
      }
      function apply() {
        if (!block || !panel) return;
        if (mob()) {
          var open = block.classList.contains("dp");
          panel.hidden = !open;
          btn.setAttribute("aria-expanded", open ? "true" : "false");
        } else {
          block.classList.add("dp");
          panel.hidden = false;
          btn.setAttribute("aria-expanded", "true");
        }
      }
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        if (!mob() || !block) return;
        block.classList.toggle("dp");
        apply();
      });
      window.addEventListener("resize", apply);
      if (mob()) block.classList.remove("dp");
      apply();
    });
    function isHomePage() {
      var p = location.pathname.replace(/\\/g, "/").toLowerCase();
      return p === "/" || p.endsWith("/") || /index\.html?$/i.test(p);
    }
    function goPageTop() {
      window.scrollTo({ top: 0, behavior: "smooth" });
      if (drawer) setDrawer(false);
    }
    document.querySelectorAll(".ar").forEach(function (a) {
      a.addEventListener("click", function (e) {
        if (!window.matchMedia("(max-width:767px)").matches) return;
        if (isHomePage()) {
          e.preventDefault();
          if (stepMine && !stepMine.hidden) {
            ozClearReviewHash();
            showStep("form");
          } else {
            ozSetCuTab("home");
            goPageTop();
          }
        }
      });
    });
    document.querySelectorAll("#cu a.cq").forEach(function (a) {
      a.addEventListener("click", function () {
        ozSetCuTab("mine");
      });
    });
  }
})();