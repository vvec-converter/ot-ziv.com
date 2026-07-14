/* Адрес и отправка на Cloudflare Worker */
var OZ_SEND_URL = "https://noisy-wood-0e6f.akkgromms.workers.dev/";

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
