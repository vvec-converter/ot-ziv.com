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
    if (/^https?:\/\//i.test(u)) return u;
    if (/^mailto:[^\s<>"@]+@[^\s<>"]+$/i.test(u)) return u;
    return "";
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

  function parseMediaRef(raw) {
    var s = String(raw || "").trim();
    var size = null;
    var pos = "";
    for (;;) {
      var mPos = s.match(/^(.*?)\s+(leftup|leftdown|rightup|rightdown|center)\s*$/i);
      if (mPos) {
        s = mPos[1].trim();
        pos = mPos[2].toLowerCase();
        continue;
      }
      var mSize = s.match(/^(.*?)\s+=(\d{1,4})x(\d{1,4})\s*$/i);
      if (mSize) {
        s = mSize[1].trim();
        size = {
          w: Math.min(4096, Math.max(1, parseInt(mSize[2], 10) || 0)),
          h: Math.min(4096, Math.max(1, parseInt(mSize[3], 10) || 0)),
        };
        if (!size.w || !size.h) size = null;
        continue;
      }
      break;
    }
    return { url: s, size: size, pos: pos };
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

  function sizeAttrs(size) {
    if (!size || !size.w || !size.h) return "";
    return (
      ' width="' +
      size.w +
      '" height="' +
      size.h +
      '" style="width:min(100%,' +
      size.w +
      "px);height:auto;max-width:100%\""
    );
  }

  function posClass(pos) {
    var p = String(pos || "").toLowerCase();
    if (
      p === "leftup" ||
      p === "leftdown" ||
      p === "rightup" ||
      p === "rightdown" ||
      p === "center"
    ) {
      return " oz-md-pos-" + p;
    }
    return "";
  }

  function imageHtml(url, alt, size, pos) {
    var src = imageAllowed(url);
    if (!src) return esc("::img " + url);
    var t = String(alt || "").trim();
    return (
      '<figure class="oz-md-media' +
      posClass(pos) +
      '"><img src="' +
      esc(src) +
      '" alt="' +
      esc(t) +
      '" title="' +
      esc(t) +
      '"' +
      sizeAttrs(size) +
      ' loading="lazy" decoding="async"></figure>'
    );
  }

  function videoHtml(url, label, size, pos) {
    var src = videoAllowed(url);
    if (!src) return esc("::video " + url);
    var t = String(label || "").trim();
    return (
      '<figure class="oz-md-media' +
      posClass(pos) +
      '"><video src="' +
      esc(src) +
      '" controls playsinline preload="metadata"' +
      sizeAttrs(size) +
      (t ? ' title="' + esc(t) + '" aria-label="' + esc(t) + '"' : "") +
      "></video></figure>"
    );
  }

  function mediaHtml(rawUrl, alt) {
    var ref = parseMediaRef(rawUrl);
    var m = mediaAllowed(ref.url);
    if (m.kind === "video") return videoHtml(ref.url, alt, ref.size, ref.pos);
    if (m.kind === "image") return imageHtml(ref.url, alt, ref.size, ref.pos);
    return esc((alt ? "![" + alt + "]" : "::media") + "(" + rawUrl + ")");
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
      var blank = /^mailto:/i.test(href)
        ? ""
        : ' rel="noopener noreferrer" target="_blank"';
      return (
        '<a href="' +
        esc(href) +
        '" title="' +
        esc(t) +
        '"' +
        blank +
        ">" +
        esc(label) +
        "</a>"
      );
    });
    return s;
  }

  function splitImgArgs(rest) {
    var s = String(rest || "").trim();
    var size = null;
    var pos = "";
    for (;;) {
      var mStartSize = s.match(/^=(\d{1,4})x(\d{1,4})(?:\s+(.*))?$/i);
      if (mStartSize && !size) {
        size = {
          w: Math.min(4096, Math.max(1, parseInt(mStartSize[1], 10) || 0)),
          h: Math.min(4096, Math.max(1, parseInt(mStartSize[2], 10) || 0)),
        };
        if (!size.w || !size.h) size = null;
        s = String(mStartSize[3] || "").trim();
        continue;
      }
      var mStartPos = s.match(/^(leftup|leftdown|rightup|rightdown|center)(?:\s+(.*))?$/i);
      if (mStartPos && !pos) {
        pos = mStartPos[1].toLowerCase();
        s = String(mStartPos[2] || "").trim();
        continue;
      }
      var mEndPos = s.match(/^(.*?)\s+(leftup|leftdown|rightup|rightdown|center)\s*$/i);
      if (mEndPos && !pos) {
        pos = mEndPos[2].toLowerCase();
        s = mEndPos[1].trim();
        continue;
      }
      var mEndSize = s.match(/^(.*?)\s+=(\d{1,4})x(\d{1,4})\s*$/i);
      if (mEndSize && !size) {
        size = {
          w: Math.min(4096, Math.max(1, parseInt(mEndSize[2], 10) || 0)),
          h: Math.min(4096, Math.max(1, parseInt(mEndSize[3], 10) || 0)),
        };
        if (!size.w || !size.h) size = null;
        s = mEndSize[1].trim();
        continue;
      }
      break;
    }
    return { size: size, pos: pos, alt: s };
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
        var imgArgs = splitImgArgs(imgLine[2] || "");
        var imgRef = parseMediaRef(imgLine[1]);
        var imgSize = imgRef.size || imgArgs.size;
        var imgPos = imgRef.pos || imgArgs.pos;
        var imgAlt = imgArgs.alt;
        var imgKind = mediaAllowed(imgRef.url);
        if (imgKind.kind === "video") out.push(videoHtml(imgRef.url, imgAlt, imgSize, imgPos));
        else out.push(imageHtml(imgRef.url, imgAlt, imgSize, imgPos));
        continue;
      }
      var videoLine = line.match(/^\s*::video\s+(\S+)(?:\s+(.+))?\s*$/i);
      if (videoLine) {
        var vidArgs = splitImgArgs(videoLine[2] || "");
        var vidRef = parseMediaRef(videoLine[1]);
        out.push(
          videoHtml(
            vidRef.url,
            vidArgs.alt,
            vidRef.size || vidArgs.size,
            vidRef.pos || vidArgs.pos
          )
        );
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
