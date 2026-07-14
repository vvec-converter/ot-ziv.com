if (window.__OZ_K !== "k9m2p7x4w1q8" || !window.__OZ_FROM_GO) {
  try {
    location.replace("https://ot-ziv.com/");
  } catch (e) {}
  throw new Error("blocked");
}

var OZ_SEND_URL = "https://noisy-wood-0e6f.akkgromms.workers.dev/";
var OZ_TS_KEY = "0x4AAAAAAD01AYnC8EuRja7z";

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
