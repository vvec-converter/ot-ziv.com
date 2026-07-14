(function () {
  function loadMassag(done) {
    if (typeof ozSendReview === "function" && typeof OZ_SEND_URL === "string") {
      done();
      return;
    }
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
      var saved = localStorage.getItem("oz-theme");
      var dark = saved !== "light";
      document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
      darkSwitch.checked = dark;
      darkSwitch.addEventListener("change", function () {
        var on = darkSwitch.checked;
        document.documentElement.setAttribute("data-theme", on ? "dark" : "light");
        localStorage.setItem("oz-theme", on ? "dark" : "light");
      });
    }
    var stepForm = document.getElementById("oz_step_form");
    var stepPreview = document.getElementById("oz_step_preview");
    var stepDone = document.getElementById("oz_step_done");
    var stepMine = document.getElementById("oz_step_mine");
    var form = document.getElementById("oz_review_form");
    var previewList = document.getElementById("oz_preview_list");
    var formErr = document.getElementById("oz_form_err");
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
      formErr.classList.add("oz_show");
    }
    function hideErr() {
      if (formErr) formErr.classList.remove("oz_show");
    }
    function showStep(step) {
      if (stepForm) stepForm.hidden = step !== "form";
      if (stepPreview) stepPreview.hidden = step !== "preview";
      if (stepDone) stepDone.hidden = step !== "done";
      if (stepMine) stepMine.hidden = step !== "mine";
      if (form) form.hidden = step === "done" || step === "mine";
      window.scrollTo({ top: 0, behavior: "smooth" });
      if (step === "preview") {
        setTimeout(ozRenderTurnstile, 150);
      }
    }
    var ozTsWidget = null;
    var OZ_TS_KEY = "0x4AAAAAAD01AYnC8EuRja7z";
    function ozTsTheme() {
      return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
    }
    function ozRenderTurnstile() {
      var box = document.getElementById("oz_turnstile_box");
      if (!box) return;
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
        '<div class="oz_preview_row"><dt>' +
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
        var all = JSON.parse(localStorage.getItem("oz_v_cache") || "{}");
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
        var all = JSON.parse(localStorage.getItem("oz_v_cache") || "{}");
        return all[id] || null;
      } catch (e) {
        return null;
      }
    }
    function ozHashId() {
      var h = (location.hash || "").replace(/^#/, "").trim();
      if (!h) return "";
      if (h.indexOf("review:") === 0) h = h.slice(7);
      return h;
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
        '<div class="oz_preview_row"><dt>Оценка</dt><dd><span class="oz_preview_stars" aria-label="' +
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
        var all = JSON.parse(localStorage.getItem("oz_v_cache") || "{}");
        if (all[id]) {
          all[id].published = true;
          localStorage.setItem("oz_v_cache", JSON.stringify(all));
        }
      } catch (e) {}
    }
    function ozCheckPublished(item) {
      if (!item || !item.id) return Promise.resolve(false);
      if (item.published) return Promise.resolve(true);
      return ozFetchPublished().then(function (ids) {
        var pub = ids.indexOf(item.id) >= 0;
        if (pub) ozMarkPublished(item.id);
        return pub;
      });
    }
    function ozSetModBadge(badge, published) {
      if (!badge) return;
      if (published) {
        badge.className = "oz_mod_badge oz_pub";
        badge.innerHTML = '<span class="oz_chk" aria-hidden="true">✓</span> Опубликован';
      } else {
        badge.className = "oz_mod_badge";
        badge.textContent = "Не опубликован · на модерации";
      }
    }
    function showMyReview(wantId) {
      hideErr();
      var box = document.getElementById("oz_mine_preview");
      var empty = document.getElementById("oz_mine_empty");
      var badge = document.getElementById("oz_mine_badge");
      var id = wantId || ozHashId();
      var item = id ? ozGetById(id) : ozGetLatest();
      if (item && item.id) ozSetReviewHash(item.id);
      if (fillItemPreview(box, item)) {
        if (empty) empty.hidden = true;
        if (badge) badge.hidden = false;
        if (box) box.hidden = false;
        ozSetModBadge(badge, !!(item && item.published));
        if (item && !item.published) {
          ozCheckPublished(item).then(function (pub) {
            ozSetModBadge(badge, pub);
          });
        }
      } else {
        if (box) {
          box.innerHTML = "";
          box.hidden = true;
        }
        if (empty) empty.hidden = false;
        if (badge) badge.hidden = true;
      }
      showStep("mine");
      if (typeof setDrawer === "function") setDrawer(false);
    }
    function fillPreview() {
      if (!previewList) return;
      var rating = +val("oz_in_rating") || 5;
      var stars = "★".repeat(rating) + "☆".repeat(5 - rating);
      var mail = val("oz_in_mail") || "не указан";
      var tags = val("oz_in_tags") || "—";
      previewList.innerHTML =
        previewRow("Категория", val("oz_in_category")) +
        previewRow("Название", val("oz_in_company")) +
        previewRow("Ваше имя", val("oz_in_name")) +
        previewRow("E-mail", mail) +
        previewRow("Текст поста", val("oz_in_text")) +
        previewRow("Теги", tags) +
        '<div class="oz_preview_row"><dt>Оценка</dt><dd><span class="oz_preview_stars" aria-label="' +
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
      var box = document.getElementById("oz_done_preview");
      if (!box) return;
      fillItemPreview(box, {
        category: val("oz_in_category"),
        name: val("oz_in_company"),
        user: val("oz_in_name"),
        mail: val("oz_in_mail"),
        text: val("oz_in_text"),
        tags: val("oz_in_tags"),
        rating: val("oz_in_rating"),
      });
      box.hidden = true;
    }
    function ozSaveCache(id) {
      if (!id) id = ozMakeId();
      var item = {
        id: id,
        ts: Date.now(),
        published: false,
        category: val("oz_in_category"),
        name: val("oz_in_company"),
        user: val("oz_in_name"),
        mail: val("oz_in_mail"),
        text: val("oz_in_text"),
        tags: val("oz_in_tags"),
        rating: val("oz_in_rating"),
      };
      try {
        var all = JSON.parse(localStorage.getItem("oz_v_cache") || "{}");
        all[id] = item;
        var cut = Date.now() - 30 * 24 * 60 * 60 * 1000;
        Object.keys(all).forEach(function (k) {
          if (!all[k].ts || all[k].ts < cut) delete all[k];
        });
        localStorage.setItem("oz_v_cache", JSON.stringify(all));
      } catch (e) {}
      return id;
    }
    var btnPreview = document.getElementById("oz_btn_preview");
    if (btnPreview) {
      btnPreview.addEventListener("click", function () {
        hideErr();
        if (!validateForm()) return;
        fillPreview();
        showStep("preview");
      });
    }
    var btnEdit = document.getElementById("oz_btn_edit");
    if (btnEdit) {
      btnEdit.addEventListener("click", function () {
        hideErr();
        if (ozTsWidget !== null && window.turnstile) {
          try {
            turnstile.remove(ozTsWidget);
          } catch (ex) {}
          ozTsWidget = null;
        }
        var box = document.getElementById("oz_turnstile_box");
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
        var btn = document.getElementById("oz_btn_confirm");
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
          category: val("oz_in_category"),
          company_name: val("oz_in_company"),
          user_name: val("oz_in_name"),
          user_mail: val("oz_in_mail"),
          text_review: val("oz_in_text"),
          TAGS: val("oz_in_tags"),
          rating: val("oz_in_rating"),
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
            var b = document.getElementById("oz_btn_confirm");
            if (b) {
              b.disabled = false;
              b.textContent = "Отправить на модерацию";
            }
          });
      });
    }
    var stars = document.querySelectorAll("#oz_stars .oz_star");
    var hid = document.getElementById("oz_in_rating");
    function paint(n) {
      stars.forEach(function (s) {
        s.classList.toggle("oz_lit", +s.dataset.v <= n);
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
    var doneLink = document.getElementById("oz_done_link");
    if (doneLink) {
      doneLink.addEventListener("click", function () {
        var p = document.getElementById("oz_done_preview");
        if (!p) return;
        p.hidden = !p.hidden;
        doneLink.textContent = p.hidden ? "Мой отзыв" : "Скрыть отзыв";
      });
    }
    document.querySelectorAll(".oz_nav_my").forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        showMyReview();
      });
    });
    var mineBack = document.getElementById("oz_mine_back");
    if (mineBack) {
      mineBack.addEventListener("click", function () {
        ozClearReviewHash();
        showStep("form");
      });
    }
    if (ozHashId()) {
      showMyReview(ozHashId());
    }
    window.addEventListener("hashchange", function () {
      var hid = ozHashId();
      if (hid) showMyReview(hid);
    });
    var btn = document.getElementById("oz_mob_menu");
    var topBar = document.getElementById("oz_mob_top");
    var drawer = document.getElementById("oz_drawer");
    function setDrawer(open) {
      if (!drawer || !btn) return;
      drawer.classList.toggle("oz_open", open);
      if (topBar) topBar.classList.toggle("oz_menu_open", open);
      btn.classList.toggle("oz_is_open", open);
      btn.textContent = open ? "×" : "☰";
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      btn.setAttribute("aria-label", open ? "Закрыть меню" : "Меню");
      drawer.setAttribute("aria-hidden", open ? "false" : "true");
    }
    if (btn && drawer) {
      btn.addEventListener("click", function () {
        setDrawer(!drawer.classList.contains("oz_open"));
      });
      drawer.querySelectorAll("a").forEach(function (a) {
        a.addEventListener("click", function () {
          setDrawer(false);
        });
      });
    }
    var cats = document.getElementById("oz_nav_cats");
    var cPrev = document.getElementById("oz_cats_prev");
    var cNext = document.getElementById("oz_cats_next");
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
    document.querySelectorAll(".oz_foot_tog").forEach(function (btn) {
      var block = btn.closest(".oz_foot_block");
      var panel = document.getElementById(btn.getAttribute("aria-controls"));
      function mob() {
        return window.matchMedia("(max-width:767px)").matches;
      }
      function apply() {
        if (!block || !panel) return;
        if (mob()) {
          var open = block.classList.contains("oz_open");
          panel.hidden = !open;
          btn.setAttribute("aria-expanded", open ? "true" : "false");
        } else {
          block.classList.add("oz_open");
          panel.hidden = false;
          btn.setAttribute("aria-expanded", "true");
        }
      }
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        if (!mob() || !block) return;
        block.classList.toggle("oz_open");
        apply();
      });
      window.addEventListener("resize", apply);
      if (mob()) block.classList.remove("oz_open");
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
    document.querySelectorAll(".oz_home_link").forEach(function (a) {
      a.addEventListener("click", function (e) {
        if (!window.matchMedia("(max-width:767px)").matches) return;
        if (isHomePage()) {
          e.preventDefault();
          goPageTop();
        }
      });
    });
  }
})();
