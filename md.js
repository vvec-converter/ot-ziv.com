(function (root) {
  function esc(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function safeUrl(url) {
    var u = String(url || "").trim();
    if (!/^https?:\/\//i.test(u)) return "";
    return u;
  }

  function host(url) {
    try {
      return new URL(url).hostname.replace(/^www\./i, "").toLowerCase();
    } catch (e) {
      return "";
    }
  }

  function twitchParent() {
    try {
      return location.hostname || "ot-ziv.com";
    } catch (e) {
      return "ot-ziv.com";
    }
  }

  function embedUrl(url) {
    var u = safeUrl(url);
    if (!u) return "";
    var h = host(u);
    var m;
    var parent = encodeURIComponent(twitchParent());

    if (h === "youtube.com" || h === "m.youtube.com" || h === "youtu.be") {
      m = u.match(/[?&]v=([^&]+)/i) || u.match(/youtu\.be\/([^?&/]+)/i) || u.match(/\/embed\/([^?&/]+)/i);
      if (m && m[1]) return "https://www.youtube.com/embed/" + encodeURIComponent(m[1]);
    }
    if (h === "rutube.ru") {
      m = u.match(/\/video\/([a-f0-9-]+)/i) || u.match(/\/play\/embed\/([a-f0-9-]+)/i);
      if (m && m[1]) return "https://rutube.ru/play/embed/" + encodeURIComponent(m[1]);
    }
    if (h === "vk.com" || h === "vkvideo.ru") {
      if (/\/video_ext\.php/i.test(u)) return u;
      m = u.match(/video(-?\d+)_([0-9]+)/i);
      if (m) return "https://vk.com/video_ext.php?oid=" + m[1] + "&id=" + m[2];
    }
    if (h === "player.twitch.tv") {
      if (/[?&]parent=/i.test(u)) return u;
      var join = u.indexOf("?") >= 0 ? "&" : "?";
      return u + join + "parent=" + parent;
    }
    if (h === "clips.twitch.tv") {
      if (/\/embed/i.test(u)) {
        if (/[?&]parent=/i.test(u)) return u;
        var j = u.indexOf("?") >= 0 ? "&" : "?";
        return u + j + "parent=" + parent;
      }
      m = u.match(/clips\.twitch\.tv\/([^/?#]+)/i);
      if (m && m[1]) {
        return "https://clips.twitch.tv/embed?clip=" + encodeURIComponent(m[1]) + "&parent=" + parent;
      }
    }
    if (h === "twitch.tv") {
      m = u.match(/twitch\.tv\/videos\/(\d+)/i);
      if (m && m[1]) return "https://player.twitch.tv/?video=" + encodeURIComponent(m[1]) + "&parent=" + parent;
      m = u.match(/twitch\.tv\/[^/?#]+\/clip\/([^/?#]+)/i);
      if (m && m[1]) {
        return "https://clips.twitch.tv/embed?clip=" + encodeURIComponent(m[1]) + "&parent=" + parent;
      }
      m = u.match(/twitch\.tv\/([a-zA-Z0-9_]{2,})\/?(?:[?#]|$)/i);
      if (m && m[1] && m[1] !== "videos" && m[1] !== "directory" && m[1] !== "downloads") {
        return "https://player.twitch.tv/?channel=" + encodeURIComponent(m[1]) + "&parent=" + parent;
      }
    }
    return u;
  }

  function iframeAllowed(url) {
    var u = embedUrl(url);
    if (!u) return "";
    var h = host(u);
    if (
      h === "youtube.com" ||
      h === "youtube-nocookie.com" ||
      h === "rutube.ru" ||
      h === "vk.com" ||
      h === "vkvideo.ru" ||
      h === "player.twitch.tv" ||
      h === "clips.twitch.tv" ||
      /(^|\.)youtube\.com$/i.test(h) ||
      /(^|\.)rutube\.ru$/i.test(h) ||
      /(^|\.)twitch\.tv$/i.test(h)
    ) {
      return u;
    }
    return "";
  }

  function mediaAllowed(url) {
    var u = safeUrl(url);
    if (!u) return { kind: "", url: "" };
    if (/\.(jpe?g|png|gif|webp|avif)(\?|#|$)/i.test(u)) return { kind: "image", url: u };
    if (/\.webm(\?|#|$)/i.test(u)) return { kind: "video", url: u };
    var h = host(u);
    if (
      h === "i.imgur.com" ||
      h === "imgur.com" ||
      h === "cdn.discordapp.com" ||
      h === "media.discordapp.net" ||
      h === "pbs.twimg.com" ||
      h === "images.unsplash.com" ||
      h === "i.ibb.co" ||
      h === "postimg.cc" ||
      h === "i.postimg.cc"
    ) {
      return { kind: "image", url: u };
    }
    return { kind: "", url: "" };
  }

  function imageAllowed(url) {
    var m = mediaAllowed(url);
    return m.kind === "image" ? m.url : "";
  }

  function videoAllowed(url) {
    var m = mediaAllowed(url);
    return m.kind === "video" ? m.url : "";
  }

  function iframeHtml(url, title) {
    var src = iframeAllowed(url);
    if (!src) return esc("::iframe " + url);
    var t = String(title || "").trim() || "Встроенное видео";
    return (
      '<div class="oz-embed"><iframe src="' +
      esc(src) +
      '" title="' +
      esc(t) +
      '" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen" allowfullscreen></iframe></div>'
    );
  }

  function imageHtml(url, alt) {
    var src = imageAllowed(url);
    if (!src) return esc("::img " + url);
    var t = String(alt || "").trim();
    return (
      '<figure class="oz-md-media"><img src="' +
      esc(src) +
      '" alt="' +
      esc(t) +
      '" title="' +
      esc(t) +
      '" loading="lazy" decoding="async"></figure>'
    );
  }

  function videoHtml(url, label) {
    var src = videoAllowed(url);
    if (!src) return esc("::video " + url);
    var t = String(label || "").trim();
    return (
      '<figure class="oz-md-media"><video src="' +
      esc(src) +
      '" controls playsinline preload="metadata"' +
      (t ? ' title="' + esc(t) + '" aria-label="' + esc(t) + '"' : "") +
      "></video></figure>"
    );
  }

  function mediaHtml(url, alt) {
    var m = mediaAllowed(url);
    if (m.kind === "video") return videoHtml(url, alt);
    if (m.kind === "image") return imageHtml(url, alt);
    return esc((alt ? "![" + alt + "]" : "::media") + "(" + url + ")");
  }

  function processInline(line) {
    var s = esc(line);
    s = s.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, function (_, alt, url) {
      return mediaHtml(url, alt);
    });
    s = s.replace(/\[iframe(?:\s+([^\]]*))?\]\(([^)]+)\)/gi, function (_, title, url) {
      return iframeHtml(url, title);
    });
    s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, function (_, label, url) {
      var href = safeUrl(url);
      if (!href) return esc("[" + label + "](" + url + ")");
      var t = String(label || "").trim();
      return (
        '<a href="' +
        esc(href) +
        '" title="' +
        esc(t) +
        '" rel="noopener noreferrer" target="_blank">' +
        esc(label) +
        "</a>"
      );
    });
    return s;
  }

  function toHtml(raw) {
    var parts = String(raw || "").split("\n");
    var out = [];
    for (var i = 0; i < parts.length; i++) {
      var line = parts[i];
      var iframeLine = line.match(/^\s*::iframe\s+(\S+)(?:\s+(.+))?\s*$/i);
      if (iframeLine) {
        out.push(iframeHtml(iframeLine[1], iframeLine[2]));
        continue;
      }
      var imgLine = line.match(/^\s*::img\s+(\S+)(?:\s+(.+))?\s*$/i);
      if (imgLine) {
        out.push(mediaHtml(imgLine[1], imgLine[2] || ""));
        continue;
      }
      var videoLine = line.match(/^\s*::video\s+(\S+)(?:\s+(.+))?\s*$/i);
      if (videoLine) {
        out.push(videoHtml(videoLine[1], videoLine[2] || ""));
        continue;
      }
      var onlyImg = line.match(/^\s*!\[([^\]]*)\]\(([^)]+)\)\s*$/);
      if (onlyImg) {
        out.push(mediaHtml(onlyImg[2], onlyImg[1]));
        continue;
      }
      out.push(processInline(line));
    }
    return out.join("<br>");
  }

  function toPlain(raw) {
    return String(raw || "")
      .replace(/^\s*::iframe\s+\S+(?:\s+.+)?\s*$/gim, "")
      .replace(/^\s*::img\s+\S+(?:\s+.+)?\s*$/gim, "")
      .replace(/^\s*::video\s+\S+(?:\s+.+)?\s*$/gim, "")
      .replace(/\[iframe(?:\s+[^\]]*)?\]\([^)]+\)/gi, "")
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/__([^_]+)__/g, "$1")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  root.OZ_MD = { toHtml: toHtml, toPlain: toPlain };
})(typeof window !== "undefined" ? window : globalThis);
