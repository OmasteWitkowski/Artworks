/* Ten at a time, with a search box and filters built from the items themselves.
   Items carry data-<name> attributes (several values separated by "|") for each filter. */
function paginate(host, sel, o) {
  o = o || {};
  var per = o.per || 10, items = [].slice.call(host.querySelectorAll(sel)), st = { q: '', f: {}, page: 0 };
  if (host._pg) host._pg.remove();
  if (items.length <= per && !o.always) return;
  var bar = document.createElement('div'); bar.className = 'pg-bar'; host._pg = bar;
  var html = o.search === false ? '' : '<input type="search" class="pg-q" placeholder="' + (o.search || 'Filter') + '" aria-label="Filter this list">';
  (o.filters || []).forEach(function (f) {
    var vals = [];
    items.forEach(function (it) { (it.getAttribute('data-' + f.attr) || '').split('|').forEach(function (v) { if (v && vals.indexOf(v) < 0) vals.push(v); }); });
    if (vals.length > 1) html += '<select data-attr="' + f.attr + '" aria-label="' + f.label + '"><option value="">' + f.label + '</option>' + vals.sort().map(function (v) { return '<option>' + v.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</option>'; }).join('') + '</select>';
  });
  bar.innerHTML = html + '<span class="pg-nav"><button type="button" class="pg-prev">Previous</button><span class="pg-info" aria-live="polite"></span><button type="button" class="pg-next">Next</button></span>';
  host.parentNode.insertBefore(bar, host);
  function apply() {
    var words = st.q.toLowerCase().split(/\s+/).filter(Boolean);
    var hits = items.filter(function (it) {
      var t = (it.getAttribute('data-text') || it.textContent).toLowerCase();
      if (!words.every(function (w) { return t.indexOf(w) >= 0; })) return false;
      for (var a in st.f) if (st.f[a] && (it.getAttribute('data-' + a) || '').split('|').indexOf(st.f[a]) < 0) return false;
      return true;
    });
    var pages = Math.max(1, Math.ceil(hits.length / per)); if (st.page >= pages) st.page = pages - 1;
    items.forEach(function (it) { it.hidden = true; });
    hits.slice(st.page * per, st.page * per + per).forEach(function (it) { it.hidden = false; });
    bar.querySelector('.pg-info').textContent = hits.length ? (st.page * per + 1) + ' to ' + Math.min(hits.length, st.page * per + per) + ' of ' + hits.length : 'Nothing matches';
    bar.querySelector('.pg-prev').disabled = st.page === 0; bar.querySelector('.pg-next').disabled = st.page >= pages - 1;
  }
  var q = bar.querySelector('.pg-q'); if (q) q.oninput = function () { st.q = q.value; st.page = 0; apply(); };
  [].forEach.call(bar.querySelectorAll('select'), function (s) { s.onchange = function () { st.f[s.getAttribute('data-attr')] = s.value; st.page = 0; apply(); }; });
  bar.querySelector('.pg-prev').onclick = function () { st.page--; apply(); };
  bar.querySelector('.pg-next').onclick = function () { st.page++; apply(); if (o.scroll !== false && bar.getBoundingClientRect().top < 0) bar.scrollIntoView(); };
  apply();
}

(function () {
  function init() {
    [].forEach.call(document.querySelectorAll('[data-paged]'), function (host) {
      var filters = (host.getAttribute('data-filters') || '').split(';').filter(Boolean).map(function (x) { var p = x.split(':'); return { attr: p[0], label: p[1] }; });
      paginate(host, '[data-item]', { search: host.getAttribute('data-search') || 'Search', filters: filters });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
