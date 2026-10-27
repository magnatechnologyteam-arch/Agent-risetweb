/* Adapter data: bila halaman dibuka di luar Claude (mis. di Vercel), sediakan
   window.claude.use("db") yang membaca data/state.json (hanya baca, diperbarui tiap 30 detik).
   Di dalam Claude, window.claude sudah ada dan adapter ini tidak melakukan apa-apa. */
(function () {
  if (window.claude && window.claude.use) return;
  var URL_STATE = "data/state.json", EVERY = 30000, cache = null, subs = [];
  function snapOf(items) { return { docs: items.map(function (x) { return { id: x.id, data: function () { return x.data; } }; }) }; }
  function rows(name) {
    if (!cache) return [];
    if (name === "log") return (cache.log || []).map(function (d, i) { return { id: "l" + i, data: d }; });
    var o = cache[name] || {}; return Object.keys(o).map(function (k) { return { id: k, data: o[k] }; });
  }
  function emit() { subs.forEach(function (s) { s(); }); }
  function load() {
    return fetch(URL_STATE + "?t=" + Date.now(), { cache: "no-store" }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (j) { cache = j; emit(); }).catch(function () { subs.forEach(function (s) { if (s.err) s.err(); }); });
  }
  function query(name, ord, lim) {
    return {
      orderBy: function (f, dir) { return query(name, { f: f, dir: dir }, lim); },
      limit: function (n) { return query(name, ord, n); },
      onSnapshot: function (cb, err) {
        var run = function () {
          var items = rows(name);
          if (ord) items.sort(function (a, b) { var x = a.data[ord.f], y = b.data[ord.f]; return (x < y ? -1 : x > y ? 1 : 0) * (ord.dir === "desc" ? -1 : 1); });
          if (lim) items = items.slice(0, lim);
          cb(snapOf(items));
        };
        run.err = err; subs.push(run); if (cache) run();
        return function () { subs = subs.filter(function (s) { return s !== run; }); };
      }
    };
  }
  var db = {
    collection: function (name) { var q = query(name, null, null); q.add = function () { return Promise.reject(new Error("read-only")); }; return q; },
    doc: function () { return { update: function () { return Promise.reject(new Error("read-only")); } }; }
  };
  load(); setInterval(load, EVERY);
  window.claude = { use: function (n) { return Promise.resolve(n === "db" ? db : n === "user" ? { canEdit: function () { return false; } } : null); } };
})();
