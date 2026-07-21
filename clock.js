(function () {
  var clockTime = document.getElementById("oz-clock-time");
  var clockDate = document.getElementById("oz-clock-date");
  if (!clockTime && !clockDate) return;
  function tickClock() {
    var now = new Date();
    var t = now.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    var d = now.toLocaleDateString("ru-RU", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    if (clockTime) {
      clockTime.textContent = t;
      clockTime.setAttribute("datetime", now.toISOString());
    }
    if (clockDate) clockDate.textContent = d;
  }
  tickClock();
  setInterval(tickClock, 1000);
})();
