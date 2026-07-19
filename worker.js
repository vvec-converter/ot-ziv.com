export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === "/massag.js" || path === "/messag.js") {
      return handleMassagRequest(request);
    }

    const cors = corsHeaders(request);

    try {
      if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: cors });
      }

      if (request.method === "GET") {
        return json(
          {
            ok: true,
            worker: "ot-ziv-reviews",
            kv: !!env.REVIEWS,
            turnstile: !!env.TURNSTILE_SECRET_KEY,
          },
          200,
          cors
        );
      }

      if (request.method !== "POST") {
        return json({ error: "Только POST" }, 405, cors);
      }

      if (!env.REVIEWS) {
        return json({ error: "KV не подключена (REVIEWS)" }, 500, cors);
      }
      if (!env.TURNSTILE_SECRET_KEY) {
        return json({ error: "Нет TURNSTILE_SECRET_KEY" }, 500, cors);
      }

      let data;
      const ctype = request.headers.get("Content-Type") || "";
      if (ctype.includes("application/json")) {
        data = await request.json();
      } else {
        const form = await request.formData();
        data = Object.fromEntries(form.entries());
      }

      if ((data._gotcha || "").trim()) {
        return json({ error: "Отклонено" }, 400, cors);
      }

      const token = (data["cf-turnstile-response"] || "").trim();
      if (!token) {
        return json({ error: "Пройдите проверку «человек»" }, 400, cors);
      }

      const ip = request.headers.get("CF-Connecting-IP") || "";
      const okHuman = await verifyTurnstile(env.TURNSTILE_SECRET_KEY, token, ip);
      if (!okHuman) {
        return json({ error: "Проверка не пройдена. Попробуйте снова." }, 403, cors);
      }

      const rate = await checkIpRate(env.REVIEWS, ip);
      if (!rate.ok) {
        return json(
          { error: "С этого адреса уже отправлено 3 отзыва за 24 часа. Попробуйте завтра." },
          429,
          cors
        );
      }

      const review_id = (data.review_id || "").trim() || crypto.randomUUID();
      const category = (data.category || "").trim();
      const company_name = (data.company_name || "").trim();
      const user_name = (data.user_name || "").trim();
      const text_review = (data.text_review || "").trim();
      const rating = String(data.rating || "5").trim();

      if (!category || !company_name || !user_name || !text_review) {
        return json({ error: "Заполните обязательные поля" }, 400, cors);
      }

      const now = Date.now();
      const item = {
        id: review_id,
        ts: now,
        status: "moderation",
        category,
        name: company_name.slice(0, 59),
        user: user_name.slice(0, 10),
        mail: (data.user_mail || "").trim().slice(0, 40),
        text: text_review.slice(0, 2500),
        tags: (data.TAGS || "").trim(),
        rating: Math.min(5, Math.max(1, parseInt(rating, 10) || 5)),
      };

      await env.REVIEWS.put("review:" + review_id, JSON.stringify(item));
      await saveIpRate(env.REVIEWS, ip, rate.times, now);

      return json({ ok: true, id: review_id }, 200, cors);
    } catch (err) {
      return json(
        { error: "Ошибка сервера", detail: String(err && err.message ? err.message : err) },
        500,
        cors
      );
    }
  },
};

function corsHeaders(request) {
  const origin = request.headers.get("Origin") || "";
  const allow =
    origin === "https://ot-ziv.com" ||
    origin === "https://www.ot-ziv.com" ||
    origin.endsWith(".pages.dev")
      ? origin
      : "https://ot-ziv.com";

  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json; charset=utf-8",
    Vary: "Origin",
  };
}

const RATE_MAX = 3;
const RATE_WINDOW_MS = 24 * 60 * 60 * 1000;

function handleMassagRequest(request) {
  const dest = (request.headers.get("Sec-Fetch-Dest") || "").toLowerCase();
  const mode = (request.headers.get("Sec-Fetch-Mode") || "").toLowerCase();

  if (dest === "document" || mode === "navigate") {
    return Response.redirect("https://ot-ziv.com/", 302);
  }

  const body =
    'if(window.__OZ_K!=="k9m2p7x4w1q8"||!window.__OZ_FROM_GO){try{location.replace("https://ot-ziv.com/");}catch(e){}throw new Error("blocked");}' +
    'var OZ_SEND_URL="https://noisy-wood-0e6f.akkgromms.workers.dev/";' +
    'var OZ_TS_KEY="0x4AAAAAAD01AYnC8EuRja7z";' +
    'function ozSendReview(body){return fetch(OZ_SEND_URL,{method:"POST",body:body}).then(function(r){return r.json().then(function(d){return{ok:r.ok,status:r.status,data:d};}).catch(function(){return{ok:r.ok,status:r.status,data:null};});});}';

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

async function checkIpRate(kv, ip) {
  const key = "rate:" + (ip || "unknown");
  const raw = await kv.get(key);
  let times = [];
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      times = Array.isArray(parsed) ? parsed : parsed.times || [];
    } catch {
      times = [];
    }
  }
  const cut = Date.now() - RATE_WINDOW_MS;
  times = times.filter(function (t) {
    return typeof t === "number" && t > cut;
  });
  if (times.length >= RATE_MAX) {
    return { ok: false, times: times };
  }
  return { ok: true, times: times };
}

async function saveIpRate(kv, ip, times, now) {
  const key = "rate:" + (ip || "unknown");
  const next = times.concat([now]).slice(-RATE_MAX);
  await kv.put(key, JSON.stringify(next), { expirationTtl: 60 * 60 * 24 });
}

async function verifyTurnstile(secret, token, ip) {
  const body = new URLSearchParams();
  body.set("secret", secret);
  body.set("response", token);
  if (ip) body.set("remoteip", ip);
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body,
  });
  const out = await res.json();
  return !!out.success;
}

function json(obj, status, cors) {
  return new Response(JSON.stringify(obj), { status, headers: cors });
}
