(function (w) {
  var BY_CAT = {
    Товары: [
      { slug: "elektronika", name: "Электроника и гаджеты" },
      { slug: "bytovaya-tehnika", name: "Бытовая техника" },
      { slug: "transport", name: "Транспортные средства" },
      { slug: "krasota-zdorove", name: "Красота и здоровье" },
      { slug: "odezhda", name: "Одежда, обувь и аксессуары" },
      { slug: "dom-remont", name: "Дом и ремонт" },
      { slug: "detskie-tovary", name: "Детские товары" },
      { slug: "knigi-hobbi", name: "Книги и хобби" },
    ],
    Места: [
      { slug: "obshchepit", name: "Общепит" },
      { slug: "oteli-turizm", name: "Отели и туризм" },
      { slug: "razvlecheniya", name: "Развлечения и отдых" },
      { slug: "krasota-sport", name: "Красота и спорт" },
      { slug: "medicina-mesta", name: "Медицинские заведения" },
      { slug: "torgovlya", name: "Торговля" },
    ],
    Услуги: [
      { slug: "finansy", name: "Финансы и страхование" },
      { slug: "bytovye-uslugi", name: "Бытовые услуги" },
      { slug: "transport-logistika", name: "Транспорт и логистика" },
      { slug: "remont-avtoservis", name: "Ремонт и автосервис" },
      { slug: "svyaz-internet", name: "Связь и интернет" },
      { slug: "obuchenie", name: "Обучение" },
      { slug: "meropriyatiya", name: "Организация мероприятий" },
    ],
    Сайты: [
      { slug: "marketplejsy", name: "Маркетплейсы и магазины" },
      { slug: "striming", name: "Стриминг и медиа" },
      { slug: "igry", name: "Игры" },
      { slug: "obyavleniya", name: "Сервисы объявлений" },
      { slug: "soft", name: "Полезный софт" },
    ],
    "Работа и Карьера": [
      { slug: "setevoj-biznes", name: "Крупный сетевой бизнес" },
      { slug: "it-digital", name: "IT и digital" },
      { slug: "proizvodstvo", name: "Производство и заводы" },
      { slug: "kadrovye", name: "Кадровые агентства" },
      { slug: "frilans", name: "Фриланс и подработка" },
    ],
    "Люди и Персоны": [
      { slug: "chastnye-mastera", name: "Частные мастера" },
      { slug: "byuti-mastera", name: "Бьюти-мастера" },
      { slug: "vrachi-psihologi", name: "Здоровье и психология" },
      { slug: "infobiznes", name: "Инфобизнес и блогеры" },
    ],
    "Общество и Государство": [
      { slug: "gosuslugi", name: "Госуслуги и ведомства" },
      { slug: "obrazovanie", name: "Образование" },
      { slug: "medicina-gos", name: "Государственная медицина" },
      { slug: "gorodskaya-sreda", name: "Городская среда" },
      { slug: "zhkh", name: "Инфраструктура и ЖКХ" },
    ],
  };

  var MAX = 2;
  var BY_SLUG = {};
  var CAT_SLUGS = {};
  Object.keys(BY_CAT).forEach(function (cat) {
    BY_CAT[cat].forEach(function (t) {
      BY_SLUG[t.slug] = t;
      CAT_SLUGS[t.slug] = true;
    });
  });

  function slugify(s) {
    return String(s || "")
      .trim()
      .toLowerCase()
      .replace(/ё/g, "е")
      .replace(/[^a-z0-9а-я]+/gi, "-")
      .replace(/^-+|-+$/g, "");
  }

  function mergeUserTags(list) {
    (list || []).forEach(function (t) {
      if (!t) return;
      var slug = String(t.slug || "").trim() || slugify(t.name);
      var name = String(t.name || "").trim() || slug;
      if (!slug) return;
      if (!BY_SLUG[slug]) {
        BY_SLUG[slug] = { slug: slug, name: name, user: true };
      } else if (!CAT_SLUGS[slug] && name) {
        BY_SLUG[slug].name = name;
      }
    });
  }

  function loadUserTags() {
    return fetch("data/tags.json?t=" + Date.now())
      .then(function (r) {
        if (!r.ok) return [];
        return r.json();
      })
      .then(function (d) {
        var list = Array.isArray(d) ? d : [];
        mergeUserTags(list);
        return list;
      })
      .catch(function () {
        return [];
      });
  }

  function fromName(name) {
    var n = String(name || "").trim();
    if (!n) return null;
    var slug = slugify(n);
    if (!slug) return null;
    if (BY_SLUG[slug] && BY_SLUG[slug].name) {
      return { slug: slug, name: BY_SLUG[slug].name, kind: "name" };
    }
    return { slug: slug, name: n, kind: "name" };
  }

  function isCategorySlug(slug) {
    return !!CAT_SLUGS[slug];
  }

  function parseTagSlugs(raw) {
    if (Array.isArray(raw)) {
      return raw
        .map(function (x) {
          if (!x) return "";
          if (typeof x === "object") return String(x.slug || x.name || "").trim();
          return String(x).trim();
        })
        .filter(Boolean)
        .map(function (x) {
          return BY_SLUG[x] ? x : slugify(x);
        })
        .filter(Boolean);
    }
    return String(raw || "")
      .split(",")
      .map(function (x) {
        return x.trim();
      })
      .filter(Boolean)
      .map(function (x) {
        return BY_SLUG[x] ? x : slugify(x);
      })
      .filter(Boolean);
  }

  function tagName(slug) {
    return (BY_SLUG[slug] && BY_SLUG[slug].name) || slug;
  }

  function tagHref(slug) {
    return "otzyvy.html?tag=" + encodeURIComponent(slug);
  }

  function reviewHasTag(review, slug) {
    if (!slug) return false;
    return parseTagSlugs(review && review.tags).indexOf(slug) !== -1;
  }

  function tagsForCategory(catName) {
    return BY_CAT[catName] || [];
  }

  function userTagsFromReview(review) {
    var slugs = parseTagSlugs(review && review.tags);
    var nameTag = fromName(review && review.name);
    var out = [];
    var seen = {};
    function push(slug, name) {
      if (!slug || CAT_SLUGS[slug] || seen[slug]) return;
      seen[slug] = true;
      out.push({ slug: slug, name: name || tagName(slug) });
    }
    if (nameTag && slugs.indexOf(nameTag.slug) !== -1) {
      push(nameTag.slug, nameTag.name);
    }
    slugs.forEach(function (s) {
      push(s, tagName(s));
    });
    return out;
  }

  w.OZ_TAGS = {
    MAX: MAX,
    byCat: BY_CAT,
    bySlug: BY_SLUG,
    slugify: slugify,
    parse: parseTagSlugs,
    name: tagName,
    href: tagHref,
    has: reviewHasTag,
    forCategory: tagsForCategory,
    fromName: fromName,
    isCategory: isCategorySlug,
    loadUserTags: loadUserTags,
    mergeUserTags: mergeUserTags,
    userTagsFromReview: userTagsFromReview,
  };
})(window);
