/* The shop: every piece, narrowed the way Fine Art America's own shop narrows art. Filters down the side (product,
   medium, subject, collection, place, colour, wall shape, room, size), style chips and a search box across the top,
   a sort, and a grid that grows as you ask. Choosing a product (framed prints, say) shows each piece's starting
   price for it and sends Buy straight to that product on FAA.
   FAASCShop.mount(el, items, {url, note(p), onWall(p), cta, more}) . Items come from the site build (sitegen.item). */
(function () {
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var PRODUCTS = [['framed-print', 'Framed Prints'], ['art-print', 'Art Prints'], ['canvas-print', 'Canvas Prints'], ['metal-print', 'Metal Prints'],
    ['acrylic-print', 'Acrylic Prints'], ['wood-print', 'Wood Prints'], ['poster', 'Posters'], ['tapestry', 'Tapestries']];
  var SHAPES = { 'horizontal': 'Horizontal', 'vertical': 'Vertical', 'square': 'Square', 'panoramic horizontal': 'Panoramic', 'panoramic vertical': 'Tall panoramic' };
  var SWATCH = { red: '#c0392b', orange: '#e67e22', gold: '#c9a227', yellow: '#f1c40f', green: '#3e8e41', teal: '#16a085', turquoise: '#1abc9c', blue: '#2e6fbf',
    purple: '#7d4bb3', pink: '#e58ab0', brown: '#7a5230', black: '#111', white: '#f7f7f2', gray: '#8c8c8c' };
  var STYLES = [
    ['abstract', 'Abstract', function (p) { return p.abs; }], ['real', 'Places & things', function (p) { return !p.abs; }],
    ['bw', 'Black & White', function (p) { return p.bw; }], ['photo', 'Photography', function (p) { return p.medium === 'Photography'; }],
    ['digital', 'Digital Art', function (p) { return p.medium === 'Digital Art'; }], ['pano', 'Panoramic', function (p) { return /panoramic/.test(p.shape); }],
    ['big', 'Statement size', function (p) { return p.max_in >= 48; }]];
  // the facets down the side: key, label, how to read a piece's values
  var FACETS = [
    ['medium', 'Medium', function (p) { return p.medium ? [p.medium] : []; }],
    ['subject', 'Subject', function (p) { return p.sections || []; }],
    ['sub', 'Collection', function (p) { return p.sub ? [p.sub] : []; }],
    ['place', 'Place', function (p) { return p.places || []; }],
    ['color', 'Colour', function (p) { return p.color || []; }],
    ['shape', 'Wall shape', function (p) { return p.shape ? [SHAPES[p.shape] || p.shape] : []; }],
    ['room', 'Room', function (p) { return p.rooms || []; }]];
  var SORTS = [['rel', 'Most relevant'], ['pop', 'Most popular'], ['new', 'Newest'], ['big', 'Largest prints'], ['az', 'Title A to Z']];

  function mount(el, items, o) {
    o = o || {};
    var st = { q: '', product: '', style: '', sort: 'rel', f: {}, shown: o.per || 24 };
    FACETS.forEach(function (f) { st.f[f[0]] = []; });
    if (o.url) {           // a link can carry its filters: all.html?subject=Hawaii+%26+the+Kohala+Coast&product=framed-print
      var u = new URLSearchParams(location.search);
      st.q = u.get('q') || ''; st.product = u.get('product') || ''; st.style = u.get('style') || ''; st.sort = u.get('sort') || 'rel';
      FACETS.forEach(function (f) { st.f[f[0]] = u.getAll(f[0]); });
    }
    function save() {
      if (!o.url) return;
      var u = new URLSearchParams();
      if (st.q) u.set('q', st.q); if (st.product) u.set('product', st.product); if (st.style) u.set('style', st.style); if (st.sort !== 'rel') u.set('sort', st.sort);
      FACETS.forEach(function (f) { st.f[f[0]].forEach(function (v) { u.append(f[0], v); }); });
      try { history.replaceState(null, '', location.pathname + (u.toString() ? '?' + u : '') + location.hash); } catch (e) { }
    }
    function words(p) { return p._w || (p._w = [p.title, p.text, (p.places || []).join(' '), (p.sections || []).join(' '), p.sub, p.medium].join(' ').toLowerCase()); }
    function pass(p, skip) {
      if (st.q && !st.q.toLowerCase().split(/\s+/).filter(Boolean).every(function (w) { return words(p).indexOf(w) >= 0; })) return false;
      if (skip !== 'product' && st.product && p.products && p.products.length && !p.products.some(function (x) { return x[0] === st.product; })) return false;
      if (st.style) { var s = STYLES.filter(function (x) { return x[0] === st.style; })[0]; if (s && !s[2](p)) return false; }
      return FACETS.every(function (f) {
        if (f[0] === skip || !st.f[f[0]].length) return true;
        var vals = f[2](p); return st.f[f[0]].some(function (v) { return vals.indexOf(v) >= 0; });
      });
    }
    function counts(key, read) {      // each value's count, with every other filter applied
      var c = {}; items.forEach(function (p) { if (pass(p, key)) read(p).forEach(function (v) { c[v] = (c[v] || 0) + 1; }); }); return c;
    }
    function sorted(list) {
      // most relevant: how well a piece answers the search (its title counts most), then how popular it is
      var ws = st.q.toLowerCase().split(/\s+/).filter(Boolean);
      list.forEach(function (p) { var t = ' ' + p.title.toLowerCase() + ' ', n = o.score ? o.score(p) : 0;
        ws.forEach(function (w) { n += t.indexOf(' ' + w) >= 0 ? 3 : t.indexOf(w) >= 0 ? 2 : 1; }); p._s = n; });
      var by = { rel: function (a, b) { return b._s - a._s || (b.pop || 0) - (a.pop || 0); }, pop: function (a, b) { return (b.pop || 0) - (a.pop || 0); }, new: function (a, b) { return String(b.up || '').localeCompare(String(a.up || '')); },
        big: function (a, b) { return (b.max_in || 0) - (a.max_in || 0); }, az: function (a, b) { return a.title.localeCompare(b.title); } }[st.sort];
      return list.slice().sort(by);
    }
    function price(p) { var x = (p.products || []).filter(function (x) { return x[0] === st.product; })[0]; var v = x && x[x.length - 1]; return typeof v === 'number' ? v : 0; }      // [code, price] in the shop file, [code, name, price] on the curator
    function buyUrl(p) { return p.buy ? p.buy.split('?')[0] + (st.product ? '?product=' + st.product : '') : ''; }

    el.classList.add('shop');
    el.innerHTML = '<div class="shop-top"><input type="search" class="shop-q" placeholder="' + esc(o.search || 'Search wall art: a place, a colour, a flower…') + '" aria-label="Search the art">' +
      '<div class="shop-styles" role="group" aria-label="Style"></div></div>' +
      '<button type="button" class="shop-ft" aria-expanded="false">Filters</button>' +
      '<div class="shop-body"><aside class="shop-side" aria-label="Filters"></aside><div class="shop-main"><div class="shop-bar"></div><div class="shop-grid"></div><div class="shop-foot"></div></div></div>';
    var side = el.querySelector('.shop-side'), grid = el.querySelector('.shop-grid'), bar = el.querySelector('.shop-bar'), foot = el.querySelector('.shop-foot');
    var qin = el.querySelector('.shop-q'); qin.value = st.q;
    var timer; qin.oninput = function () { clearTimeout(timer); timer = setTimeout(function () { st.q = qin.value.trim(); st.shown = o.per || 24; draw(); }, 200); };
    el.querySelector('.shop-ft').onclick = function () { var on = el.classList.toggle('shop-open'); this.setAttribute('aria-expanded', on); };
    var open = { product: true, subject: true };

    function group(key, label, body, n) {
      return '<details class="shop-g"' + (open[key] || n ? ' open' : '') + ' data-g="' + key + '"><summary><small>' + esc(label) + '</small><b>' + (n ? n + ' chosen' : 'All') + '</b></summary>' + body + '</details>';
    }
    function draw() {
      var hits = sorted(items.filter(function (p) { return pass(p); }));
      // style chips
      el.querySelector('.shop-styles').innerHTML = STYLES.filter(function (s) { return items.some(s[2]); }).map(function (s) {
        return '<button type="button" data-style="' + s[0] + '" aria-pressed="' + (st.style === s[0]) + '">' + esc(s[1]) + '</button>'; }).join('');
      // the side
      var pc = {}; items.forEach(function (p) { if (pass(p, 'product')) (p.products || []).forEach(function (x) { pc[x[0]] = (pc[x[0]] || 0) + 1; }); });
      var html = group('product', 'Product', '<div class="shop-prods">' + [['', 'All']].concat(PRODUCTS.filter(function (x) { return pc[x[0]]; })).map(function (x) {
        return '<button type="button" data-product="' + x[0] + '" aria-pressed="' + (st.product === x[0]) + '">' + esc(x[1]) + '</button>'; }).join('') + '</div>', st.product ? 1 : 0);
      FACETS.forEach(function (f) {
        var c = counts(f[0], f[2]), keys = Object.keys(c);
        st.f[f[0]].forEach(function (v) { if (keys.indexOf(v) < 0) { keys.push(v); c[v] = 0; } });
        if (keys.length < 2 && !st.f[f[0]].length) return;
        keys.sort(function (a, b) { return f[0] === 'subject' || f[0] === 'medium' ? c[b] - c[a] || a.localeCompare(b) : (c[b] - c[a]) || a.localeCompare(b); });
        var many = keys.length > 8;
        html += group(f[0], f[1], '<ul' + (many ? ' class="shop-many"' : '') + '>' + keys.map(function (v, i) {
          var on = st.f[f[0]].indexOf(v) >= 0;
          return '<li' + (many && i >= 8 && !on ? ' class="shop-x"' : '') + '><label><input type="checkbox" data-f="' + f[0] + '" value="' + esc(v) + '"' + (on ? ' checked' : '') + '>' +
            (f[0] === 'color' ? '<i class="shop-sw" style="background:' + (SWATCH[v] || v) + '"></i>' : '') + '<span>' + esc(v) + '</span><small>' + c[v] + '</small></label></li>'; }).join('') +
          '</ul>' + (many ? '<button type="button" class="shop-all" data-all="' + f[0] + '">View all ' + keys.length + '</button>' : ''), st.f[f[0]].length);
      });
      side.innerHTML = html;
      // the bar: how many, what is chosen, the sort
      var chips = [];
      if (st.q) chips.push(['q', '', '“' + st.q + '”']);
      if (st.product) chips.push(['product', '', PRODUCTS.filter(function (x) { return x[0] === st.product; })[0][1]]);
      if (st.style) chips.push(['style', '', STYLES.filter(function (x) { return x[0] === st.style; })[0][1]]);
      FACETS.forEach(function (f) { st.f[f[0]].forEach(function (v) { chips.push([f[0], v, v]); }); });
      el.querySelector('.shop-ft').textContent = 'Filters' + (chips.length ? ' (' + chips.length + ')' : '');
      bar.innerHTML = '<b class="shop-n" aria-live="polite">' + (hits.length === 1 ? '1 piece' : hits.length.toLocaleString() + ' pieces') + '</b>' +
        '<span class="shop-chips">' + chips.map(function (c, i) { return '<button type="button" data-chip="' + i + '" aria-label="Remove ' + esc(c[2]) + '">' + esc(c[2]) + ' <span aria-hidden="true">×</span></button>'; }).join('') +
        (chips.length > 1 ? '<button type="button" class="shop-clear">Clear all</button>' : '') + '</span>' +
        '<label class="shop-sort">Sort <select>' + SORTS.map(function (s) { return '<option value="' + s[0] + '"' + (st.sort === s[0] ? ' selected' : '') + '>' + s[1] + '</option>'; }).join('') + '</select></label>';
      // the grid
      var prod = PRODUCTS.filter(function (x) { return x[0] === st.product; })[0];
      grid.innerHTML = hits.slice(0, st.shown).map(function (p) {
        var i = items.indexOf(p), pr = price(p), note = o.note ? o.note(p) : '';
        return '<figure class="shop-tile" style="--ar:' + (p.ar || 1.33) + '"><a class="shop-img" href="' + esc(p.story) + '"><img loading="lazy" src="' + esc(p.img) + '" alt="' + esc(p.title) + '"></a>' +
          '<figcaption><a href="' + esc(p.story) + '">' + esc(p.title) + '</a>' + (note ? '<span class="shop-note">' + esc(note) + '</span>' : '') +
          '<span class="shop-acts">' + (o.onWall ? '<button type="button" data-wall="' + i + '">See it on a wall</button>' : '') +
          (p.buy ? '<a class="shop-buy" href="' + esc(buyUrl(p)) + '" target="_blank" rel="noopener">' + (prod ? esc(prod[1].replace(/s$/, '')) + (pr ? ' from $' + Math.round(pr) : '') : esc(o.cta || 'Buy')) + '</a>' : '') +
          '</span></figcaption></figure>';
      }).join('') || '<p class="shop-none">Nothing fits all of that. Take a filter off above.</p>';
      foot.innerHTML = hits.length > st.shown ? '<button type="button" class="shop-more">Show ' + Math.min(24, hits.length - st.shown) + ' more <small>(' + (hits.length - st.shown) + ' left)</small></button>' : '';
      bind(); save();
    }
    function bind() {
      [].forEach.call(el.querySelectorAll('[data-style]'), function (b) { b.onclick = function () { var k = b.getAttribute('data-style'); st.style = st.style === k ? '' : k; st.shown = o.per || 24; draw(); }; });
      [].forEach.call(el.querySelectorAll('[data-product]'), function (b) { b.onclick = function () { st.product = b.getAttribute('data-product'); draw(); }; });
      [].forEach.call(el.querySelectorAll('[data-f]'), function (c) { c.onchange = function () {
        var k = c.getAttribute('data-f'), l = st.f[k], at = l.indexOf(c.value);
        if (c.checked && at < 0) l.push(c.value); else if (!c.checked && at >= 0) l.splice(at, 1);
        if (k === 'subject') st.f.sub = [];      // a collection belongs to its subject
        st.shown = o.per || 24; draw(); }; });
      [].forEach.call(el.querySelectorAll('[data-all]'), function (b) { b.onclick = function () { b.parentNode.querySelector('ul').classList.remove('shop-many'); b.remove(); }; });
      [].forEach.call(el.querySelectorAll('details.shop-g'), function (d) { d.ontoggle = function () { open[d.getAttribute('data-g')] = d.open; }; });
      var chips = el.querySelectorAll('[data-chip]');
      [].forEach.call(chips, function (b) { b.onclick = function () {
        var all = []; if (st.q) all.push(['q']); if (st.product) all.push(['product']); if (st.style) all.push(['style']);
        FACETS.forEach(function (f) { st.f[f[0]].forEach(function (v) { all.push([f[0], v]); }); });
        var c = all[+b.getAttribute('data-chip')];
        if (c[0] === 'q') { st.q = ''; qin.value = ''; } else if (c[0] === 'product') st.product = ''; else if (c[0] === 'style') st.style = '';
        else st.f[c[0]].splice(st.f[c[0]].indexOf(c[1]), 1);
        draw(); }; });
      var cl = el.querySelector('.shop-clear'); if (cl) cl.onclick = function () { st.q = ''; qin.value = ''; st.product = ''; st.style = ''; FACETS.forEach(function (f) { st.f[f[0]] = []; }); draw(); };
      el.querySelector('.shop-sort select').onchange = function () { st.sort = this.value; draw(); };
      var mb = el.querySelector('.shop-more'); if (mb) mb.onclick = function () { st.shown += 24; draw(); };
      [].forEach.call(el.querySelectorAll('[data-wall]'), function (b) { b.onclick = function () { o.onWall(items[+b.getAttribute('data-wall')]); }; });
    }
    draw();
    return { set: function (q) { st.q = q; qin.value = q; draw(); } };
  }
  window.FAASCShop = { mount: mount };
  function init() { [].forEach.call(document.querySelectorAll('.faasc-shop[data-shop-src]'), function (el) {
    fetch(el.getAttribute('data-shop-src')).then(function (r) { return r.json(); })
      .then(function (items) { mount(el, items, { url: true, cta: el.getAttribute('data-cta') }); })
      .catch(function () { el.insertAdjacentHTML('afterbegin', '<p class="shop-none">The shop could not load. Please refresh the page.</p>'); }); }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
