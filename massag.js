if (!window.__OZ_FROM_GO || !window.__OZ_U) {
  try {
    location.replace("https://ot-ziv.com/");
  } catch (e) {}
  throw new Error("blocked");
}

var OZ_SEND_URL = window.__OZ_U;

function ozSendReview(body) {
  return fetch(OZ_SEND_URL, { method: "POST", body: body }).then(function (r) {
    return r
      .json()
      .then(function (d) {
        return { ok: r.ok, status: r.status, data: d };
      })
      .catch(function () {
        return { ok: r.ok, status: r.status, data: null };
      });
  });
}
